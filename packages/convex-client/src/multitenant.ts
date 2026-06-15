export interface KeyValueStorage {
  getAllKeys(): string[];
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
  clearAll?(): void;
}

export interface SecureTokenStorage {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

export interface ConvexClientLike {
  setAuth(token: string | (() => Promise<string | null>)): void;
  clearAuth(): void;
  close?(): void;
}

export interface PersistedStore {
  setState(reset: Record<string, unknown>): void;
  persist?: { clearStorage(): void | Promise<void> };
  name: string;
}

export type SwitchOrgInput = {
  fromOrgId: string;
  toOrgId: string;
  toOrgToken?: string;

  cacheStorage: KeyValueStorage;
  secureStorage: SecureTokenStorage;
  convexClient: ConvexClientLike;
  zustandStores: PersistedStore[];

  hasInflightQueue?: boolean;
  confirmFlush?: () => Promise<boolean>;
};

export type SwitchOrgResult = {
  success: boolean;
  flushedCacheKeys: string[];
  flushedStores: string[];
  reason: "success" | "user_cancelled" | "purge_incomplete" | "no_op" | "switch_in_progress";
  error?: string;
};

export const SECURE_TOKEN_KEY = "jokko.session_token";
export const GLOBAL_KEY_PREFIX = "jokko.global.";

export function getOrgKeyPrefix(orgId: string): string {
  return `jokko.${orgId}.`;
}

export function buildOrgScopedKey(orgId: string, scope: string, key: string): string {
  return `${getOrgKeyPrefix(orgId)}${scope}.${key}`;
}

export function purgeOrgScopedCache(storage: KeyValueStorage, orgId: string): string[] {
  const prefix = getOrgKeyPrefix(orgId);
  const keys = storage.getAllKeys().filter((key) => key.startsWith(prefix));

  for (const key of keys) {
    storage.delete(key);
  }

  return keys;
}

export async function switchOrg(input: SwitchOrgInput): Promise<SwitchOrgResult> {
  if (input.fromOrgId === input.toOrgId) {
    return {
      success: true,
      flushedCacheKeys: [],
      flushedStores: [],
      reason: "no_op",
    };
  }

  if (input.hasInflightQueue && input.confirmFlush) {
    const confirmed = await input.confirmFlush();
    if (!confirmed) {
      return {
        success: false,
        flushedCacheKeys: [],
        flushedStores: [],
        reason: "user_cancelled",
      };
    }
  }

  const flushedCacheKeys = purgeOrgScopedCache(input.cacheStorage, input.fromOrgId);

  const flushedStores: string[] = [];
  for (const store of input.zustandStores) {
    try {
      await store.persist?.clearStorage();
      store.setState({});
      flushedStores.push(store.name);
    } catch (err) {
      return {
        success: false,
        flushedCacheKeys,
        flushedStores,
        reason: "purge_incomplete",
        error: `Store ${store.name} reset failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      };
    }
  }

  input.convexClient.clearAuth();
  input.convexClient.close?.();

  await input.secureStorage.deleteItemAsync(SECURE_TOKEN_KEY);

  if (input.toOrgToken) {
    await input.secureStorage.setItemAsync(SECURE_TOKEN_KEY, input.toOrgToken);
    input.convexClient.setAuth(input.toOrgToken);
  }

  const remained = input.cacheStorage
    .getAllKeys()
    .filter((key) => key.startsWith(getOrgKeyPrefix(input.fromOrgId)));

  if (remained.length > 0) {
    return {
      success: false,
      flushedCacheKeys,
      flushedStores,
      reason: "purge_incomplete",
      error: `Cache purge incomplete; remained: ${remained.join(", ")}`,
    };
  }

  return {
    success: true,
    flushedCacheKeys,
    flushedStores,
    reason: "success",
  };
}

export function detectOrgLeak(
  cacheStorage: KeyValueStorage,
  secureSnapshot: Record<string, string | null>,
  forbiddenOrgId: string
): { leaked: boolean; foundIn: string[] } {
  const foundIn: string[] = [];

  for (const key of cacheStorage.getAllKeys()) {
    const value = cacheStorage.getString(key) ?? "";
    if (key.includes(forbiddenOrgId) || value.includes(forbiddenOrgId)) {
      foundIn.push(`cache:${key}`);
    }
  }

  for (const [key, value] of Object.entries(secureSnapshot)) {
    if (value && value.includes(forbiddenOrgId)) {
      foundIn.push(`secure:${key}`);
    }
  }

  return { leaked: foundIn.length > 0, foundIn };
}

export function createSwitchOrgMutex() {
  let inProgress = false;

  return async function runSwitchOrg(input: SwitchOrgInput): Promise<SwitchOrgResult> {
    if (inProgress) {
      return {
        success: false,
        flushedCacheKeys: [],
        flushedStores: [],
        reason: "switch_in_progress",
      };
    }

    inProgress = true;
    try {
      return await switchOrg(input);
    } finally {
      inProgress = false;
    }
  };
}

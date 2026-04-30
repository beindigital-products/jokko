/**
 * Spike S5 — Multi-tenant cache purge algorithm.
 *
 * Verifies the `switchOrg()` flow purges all caches (MMKV, Zustand, Convex
 * subscriptions, secure-store user identity) cleanly with NO cross-org data
 * leak. Critical for RGPD compliance (Decision #54, Architecture §17.3).
 *
 * Storage adapters are abstract here so the algorithm can be tested with
 * in-memory mocks. Production wiring (in L1, packages/convex-client) will
 * inject real MMKV / expo-secure-store / ConvexReactClient.
 */

export interface KeyValueStorage {
    getAllKeys(): string[];
    getString(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    clearAll(): void;
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
    reason: "success" | "user_cancelled" | "purge_incomplete" | "no_op";
    error?: string;
};

const SECURE_TOKEN_KEY = "jokko.session_token";

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

    const keysBefore = input.cacheStorage.getAllKeys();

    input.cacheStorage.clearAll();

    const flushedStores: string[] = [];
    for (const store of input.zustandStores) {
        try {
            await store.persist?.clearStorage();
            store.setState({});
            flushedStores.push(store.name);
        } catch (err) {
            return {
                success: false,
                flushedCacheKeys: keysBefore,
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

    const keysAfter = input.cacheStorage.getAllKeys();
    if (keysAfter.length > 0) {
        return {
            success: false,
            flushedCacheKeys: keysBefore,
            flushedStores,
            reason: "purge_incomplete",
            error: `Cache purge incomplete; remained: ${keysAfter.join(", ")}`,
        };
    }

    return {
        success: true,
        flushedCacheKeys: keysBefore,
        flushedStores,
        reason: "success",
    };
}

/**
 * Test helper / production diagnostic: scans all storages and returns true
 * if any value contains a string that should belong only to a given org.
 *
 * In production, this can be wired as a Sentry breadcrumb after every switch
 * to catch silent leaks.
 */
export function detectOrgLeak(
    cacheStorage: KeyValueStorage,
    secureSnapshot: Record<string, string | null>,
    forbiddenOrgId: string
): { leaked: boolean; foundIn: string[] } {
    const foundIn: string[] = [];

    for (const key of cacheStorage.getAllKeys()) {
        const value = cacheStorage.getString(key) ?? "";
        if (value.includes(forbiddenOrgId)) {
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

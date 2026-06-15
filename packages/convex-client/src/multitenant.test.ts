import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildOrgScopedKey,
  createSwitchOrgMutex,
  detectOrgLeak,
  switchOrg,
  type ConvexClientLike,
  type KeyValueStorage,
  type PersistedStore,
  type SecureTokenStorage,
} from "./index";

type MemoryKV = KeyValueStorage & { clearAll(): void };

function makeMemoryKV(initial: Record<string, string> = {}): MemoryKV {
  let store = { ...initial };
  return {
    getAllKeys: () => Object.keys(store),
    getString: (key) => store[key],
    set: (key, value) => {
      store[key] = value;
    },
    delete: (key) => {
      delete store[key];
    },
    clearAll: () => {
      store = {};
    },
  };
}

function makeMemorySecure(initial: Record<string, string> = {}): SecureTokenStorage & {
  snapshot: () => Record<string, string | null>;
} {
  const store: Record<string, string | null> = { ...initial };
  return {
    getItemAsync: async (key) => store[key] ?? null,
    setItemAsync: async (key, value) => {
      store[key] = value;
    },
    deleteItemAsync: async (key) => {
      store[key] = null;
    },
    snapshot: () => ({ ...store }),
  };
}

function makeFakeConvexClient(): ConvexClientLike & {
  state: { authToken: string | null; closed: boolean };
} {
  const state = { authToken: null as string | null, closed: false };
  return {
    state,
    setAuth: (token) => {
      state.authToken = typeof token === "string" ? token : "[fn]";
    },
    clearAuth: () => {
      state.authToken = null;
    },
    close: () => {
      state.closed = true;
    },
  };
}

function makeFakeStore(name: string, initialState: Record<string, unknown>): PersistedStore & {
  state: Record<string, unknown>;
  persistCleared: boolean;
} {
  const ref = {
    name,
    state: { ...initialState },
    persistCleared: false,
    setState: (reset: Record<string, unknown>) => {
      ref.state = { ...reset };
    },
    persist: {
      clearStorage: () => {
        ref.persistCleared = true;
      },
    },
  };
  return ref as PersistedStore & { state: Record<string, unknown>; persistCleared: boolean };
}

describe("@jokko/convex-client multi-tenant switch", () => {
  let cache: MemoryKV;
  let secure: ReturnType<typeof makeMemorySecure>;
  let convex: ReturnType<typeof makeFakeConvexClient>;
  let inboxStore: ReturnType<typeof makeFakeStore>;
  let composerStore: ReturnType<typeof makeFakeStore>;

  beforeEach(() => {
    cache = makeMemoryKV({
      [buildOrgScopedKey("org_A", "inbox", "snapshot")]: JSON.stringify([
        { id: "conv1", orgId: "org_A" },
      ]),
      [buildOrgScopedKey("org_A", "draft", "conv1")]: "Draft org_A",
      [buildOrgScopedKey("org_B", "inbox", "snapshot")]: JSON.stringify([
        { id: "conv2", orgId: "org_B" },
      ]),
      "jokko.global.prefs.lang": "fr",
    });
    secure = makeMemorySecure({ "jokko.session_token": "token_for_org_A" });
    convex = makeFakeConvexClient();
    convex.state.authToken = "token_for_org_A";
    inboxStore = makeFakeStore("inbox", { unread: ["conv1"] });
    composerStore = makeFakeStore("composer", { drafts: { conv1: "Draft org_A" } });
  });

  it("purges only the source org cache and preserves global/to-org keys", async () => {
    const result = await switchOrg({
      fromOrgId: "org_A",
      toOrgId: "org_B",
      toOrgToken: "token_for_org_B",
      cacheStorage: cache,
      secureStorage: secure,
      convexClient: convex,
      zustandStores: [inboxStore, composerStore],
    });

    expect(result.success).toBe(true);
    expect(result.flushedCacheKeys.sort()).toEqual(
      [
        "jokko.org_A.draft.conv1",
        "jokko.org_A.inbox.snapshot",
      ].sort()
    );
    expect(cache.getAllKeys().sort()).toEqual(
      ["jokko.global.prefs.lang", "jokko.org_B.inbox.snapshot"].sort()
    );
    expect(result.flushedStores).toEqual(["inbox", "composer"]);
    expect(await secure.getItemAsync("jokko.session_token")).toBe("token_for_org_B");
    expect(convex.state.authToken).toBe("token_for_org_B");
    expect(convex.state.closed).toBe(true);
  });

  it("does not purge when the user cancels an in-flight queue flush", async () => {
    const confirmFlush = vi.fn().mockResolvedValue(false);

    const result = await switchOrg({
      fromOrgId: "org_A",
      toOrgId: "org_B",
      cacheStorage: cache,
      secureStorage: secure,
      convexClient: convex,
      zustandStores: [inboxStore],
      hasInflightQueue: true,
      confirmFlush,
    });

    expect(result.reason).toBe("user_cancelled");
    expect(cache.getAllKeys()).toHaveLength(4);
    expect(inboxStore.persistCleared).toBe(false);
  });

  it("detects leaked cache keys, cache values, and secure values", () => {
    const result = detectOrgLeak(
      cache,
      { "jokko.session_token": "token_for_org_A" },
      "org_A"
    );

    expect(result.leaked).toBe(true);
    expect(result.foundIn).toContain("cache:jokko.org_A.inbox.snapshot");
    expect(result.foundIn).toContain("secure:jokko.session_token");
  });

  it("confirms zero residue after a complete switch", async () => {
    await switchOrg({
      fromOrgId: "org_A",
      toOrgId: "org_B",
      toOrgToken: "token_for_org_B",
      cacheStorage: cache,
      secureStorage: secure,
      convexClient: convex,
      zustandStores: [inboxStore, composerStore],
    });

    expect(detectOrgLeak(cache, secure.snapshot(), "org_A")).toEqual({
      leaked: false,
      foundIn: [],
    });
  });

  it("serializes concurrent org switches with a mutex", async () => {
    const runSwitchOrg = createSwitchOrgMutex();
    const delayedConfirm = vi.fn(
      () => new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 5))
    );

    const first = runSwitchOrg({
      fromOrgId: "org_A",
      toOrgId: "org_B",
      cacheStorage: cache,
      secureStorage: secure,
      convexClient: convex,
      zustandStores: [],
      hasInflightQueue: true,
      confirmFlush: delayedConfirm,
    });
    const second = await runSwitchOrg({
      fromOrgId: "org_A",
      toOrgId: "org_C",
      cacheStorage: cache,
      secureStorage: secure,
      convexClient: convex,
      zustandStores: [],
    });

    expect(second.reason).toBe("switch_in_progress");
    await first;
  });
});

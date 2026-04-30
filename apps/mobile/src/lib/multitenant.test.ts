import { describe, it, expect, beforeEach, vi } from "vitest";
import {
    switchOrg,
    detectOrgLeak,
    type KeyValueStorage,
    type SecureTokenStorage,
    type ConvexClientLike,
    type PersistedStore,
} from "./multitenant";

function makeMemoryKV(initial: Record<string, string> = {}): KeyValueStorage {
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
    return ref as any;
}

describe("Spike S5 — switchOrg multi-tenant cache purge", () => {
    let cache: KeyValueStorage;
    let secure: ReturnType<typeof makeMemorySecure>;
    let convex: ReturnType<typeof makeFakeConvexClient>;
    let inboxStore: ReturnType<typeof makeFakeStore>;
    let composerStore: ReturnType<typeof makeFakeStore>;
    let queueStore: ReturnType<typeof makeFakeStore>;

    beforeEach(() => {
        cache = makeMemoryKV({
            "jokko.inbox.org_A": JSON.stringify([
                { id: "conv1", orgId: "org_A", lastMessage: "Bonjour" },
            ]),
            "jokko.draft.conv1.org_A": "Texte tapé en draft",
            "jokko.prefs.lang": "fr",
        });
        secure = makeMemorySecure({
            "jokko.session_token": "token_for_org_A",
        });
        convex = makeFakeConvexClient();
        convex.state.authToken = "token_for_org_A";

        inboxStore = makeFakeStore("inbox", {
            filter: "all",
            scrollY: 320,
            unread: ["conv1"],
        });
        composerStore = makeFakeStore("composer", {
            drafts: { conv1: "Texte tapé en draft" },
        });
        queueStore = makeFakeStore("sendQueue", {
            queue: [{ id: "msg1", text: "Hello", orgId: "org_A" }],
        });
    });

    it("happy path — full purge + new token set", async () => {
        const result = await switchOrg({
            fromOrgId: "org_A",
            toOrgId: "org_B",
            toOrgToken: "token_for_org_B",
            cacheStorage: cache,
            secureStorage: secure,
            convexClient: convex,
            zustandStores: [inboxStore, composerStore, queueStore],
        });

        expect(result.success).toBe(true);
        expect(result.reason).toBe("success");
        expect(result.flushedCacheKeys.sort()).toEqual(
            ["jokko.draft.conv1.org_A", "jokko.inbox.org_A", "jokko.prefs.lang"].sort()
        );
        expect(result.flushedStores).toEqual(["inbox", "composer", "sendQueue"]);

        expect(cache.getAllKeys()).toEqual([]);

        expect(inboxStore.persistCleared).toBe(true);
        expect(composerStore.persistCleared).toBe(true);
        expect(queueStore.persistCleared).toBe(true);
        expect(inboxStore.state).toEqual({});
        expect(composerStore.state).toEqual({});
        expect(queueStore.state).toEqual({});

        expect(convex.state.authToken).toBe("token_for_org_B");
        expect(convex.state.closed).toBe(true);

        expect(await secure.getItemAsync("jokko.session_token")).toBe("token_for_org_B");
    });

    it("user cancels confirmation when queue has in-flight messages — NOTHING purged", async () => {
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

        expect(result.success).toBe(false);
        expect(result.reason).toBe("user_cancelled");
        expect(confirmFlush).toHaveBeenCalledTimes(1);

        expect(cache.getAllKeys().length).toBe(3);
        expect(inboxStore.persistCleared).toBe(false);
        expect(convex.state.authToken).toBe("token_for_org_A");
    });

    it("user confirms flush when queue has in-flight messages — full purge", async () => {
        const confirmFlush = vi.fn().mockResolvedValue(true);

        const result = await switchOrg({
            fromOrgId: "org_A",
            toOrgId: "org_B",
            toOrgToken: "token_for_org_B",
            cacheStorage: cache,
            secureStorage: secure,
            convexClient: convex,
            zustandStores: [inboxStore, queueStore],
            hasInflightQueue: true,
            confirmFlush,
        });

        expect(result.success).toBe(true);
        expect(confirmFlush).toHaveBeenCalledTimes(1);
        expect(cache.getAllKeys()).toEqual([]);
    });

    it("no-op when fromOrgId === toOrgId", async () => {
        const result = await switchOrg({
            fromOrgId: "org_A",
            toOrgId: "org_A",
            cacheStorage: cache,
            secureStorage: secure,
            convexClient: convex,
            zustandStores: [inboxStore],
        });

        expect(result.success).toBe(true);
        expect(result.reason).toBe("no_op");
        expect(cache.getAllKeys().length).toBe(3);
        expect(inboxStore.persistCleared).toBe(false);
    });

    it("no toOrgToken provided — secure store cleared but no new token set", async () => {
        const result = await switchOrg({
            fromOrgId: "org_A",
            toOrgId: "org_B",
            cacheStorage: cache,
            secureStorage: secure,
            convexClient: convex,
            zustandStores: [inboxStore],
        });

        expect(result.success).toBe(true);
        expect(await secure.getItemAsync("jokko.session_token")).toBeNull();
        expect(convex.state.authToken).toBeNull();
    });

    it("detectOrgLeak finds residual org_A data in cache after partial purge", () => {
        cache.set("jokko.inbox.org_A", JSON.stringify([{ orgId: "org_A" }]));
        cache.set("jokko.inbox.org_B", JSON.stringify([{ orgId: "org_B" }]));

        const result = detectOrgLeak(cache, {}, "org_A");

        expect(result.leaked).toBe(true);
        expect(result.foundIn).toContain("cache:jokko.inbox.org_A");
    });

    it("detectOrgLeak returns false when only target org data remains", () => {
        cache.clearAll();
        cache.set("jokko.inbox.org_B", JSON.stringify([{ orgId: "org_B" }]));

        const result = detectOrgLeak(cache, { "jokko.session_token": "token_B" }, "org_A");

        expect(result.leaked).toBe(false);
        expect(result.foundIn).toEqual([]);
    });

    it("detectOrgLeak finds residual data in secure storage too", () => {
        cache.clearAll();
        const secureSnapshot = {
            "jokko.session_token": "token_org_A_residual",
        };

        const result = detectOrgLeak(cache, secureSnapshot, "org_A");

        expect(result.leaked).toBe(true);
        expect(result.foundIn).toContain("secure:jokko.session_token");
    });

    it("regression — full switch + leak audit confirms zero residue", async () => {
        await switchOrg({
            fromOrgId: "org_A",
            toOrgId: "org_B",
            toOrgToken: "token_for_org_B",
            cacheStorage: cache,
            secureStorage: secure,
            convexClient: convex,
            zustandStores: [inboxStore, composerStore, queueStore],
        });

        const audit = detectOrgLeak(cache, secure.snapshot(), "org_A");
        expect(audit.leaked).toBe(false);
    });

    it("store reset failure surfaces purge_incomplete with details", async () => {
        const brokenStore: PersistedStore = {
            name: "broken",
            setState: () => {
                throw new Error("zustand state immutable");
            },
            persist: {
                clearStorage: () => {},
            },
        };

        const result = await switchOrg({
            fromOrgId: "org_A",
            toOrgId: "org_B",
            cacheStorage: cache,
            secureStorage: secure,
            convexClient: convex,
            zustandStores: [inboxStore, brokenStore, queueStore],
        });

        expect(result.success).toBe(false);
        expect(result.reason).toBe("purge_incomplete");
        expect(result.error).toMatch(/broken/);
        expect(result.flushedStores).toEqual(["inbox"]);
    });
});

import { describe, expect, it } from "vitest";
import { activeMentionQuery, applyMention, resolveMentions } from "./mention-parse";

describe("activeMentionQuery", () => {
    it("returns null when there is no open @ token", () => {
        expect(activeMentionQuery("Bonjour")).toBeNull();
        expect(activeMentionQuery("")).toBeNull();
    });

    it("returns '' right after typing @", () => {
        expect(activeMentionQuery("Salut @")).toBe("");
    });

    it("returns the run typed after the last @", () => {
        expect(activeMentionQuery("cc @Aw")).toBe("Aw");
        expect(activeMentionQuery("@Mama et @Aw")).toBe("Aw");
    });

    it("closes the token on whitespace", () => {
        expect(activeMentionQuery("@Awa Diop peux-tu")).toBeNull();
    });
});

describe("applyMention", () => {
    it("replaces the open @query with the full name + a space", () => {
        expect(applyMention("cc @Aw", "Awa Diop")).toBe("cc @Awa Diop ");
        expect(applyMention("@", "Mamadou Seck")).toBe("@Mamadou Seck ");
    });

    it("only touches the trailing token", () => {
        expect(applyMention("@Awa Diop et @Ma", "Mamadou Seck")).toBe("@Awa Diop et @Mamadou Seck ");
    });
});

describe("resolveMentions", () => {
    const picked = [
        { userId: "u1", name: "Awa Diop" },
        { userId: "u2", name: "Mamadou Seck" },
    ];

    it("keeps only mentions still present in the text", () => {
        expect(resolveMentions("Note pour @Awa Diop", picked)).toEqual([{ userId: "u1", name: "Awa Diop" }]);
    });

    it("dedupes by userId", () => {
        const dup = [...picked, { userId: "u1", name: "Awa Diop" }];
        expect(resolveMentions("@Awa Diop @Awa Diop", dup)).toEqual([{ userId: "u1", name: "Awa Diop" }]);
    });

    it("returns [] when no mention survives", () => {
        expect(resolveMentions("Plus de mention ici", picked)).toEqual([]);
    });
});

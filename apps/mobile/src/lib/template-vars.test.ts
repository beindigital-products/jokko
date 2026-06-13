import { describe, expect, it } from "vitest";
import { parseTokens, splitTemplateBody, tokenLabel } from "./template-vars";

describe("parseTokens", () => {
    it("returns [] when there are no placeholders", () => {
        expect(parseTokens("Bonjour, merci pour votre message.")).toEqual([]);
    });

    it("extracts unique, sorted indices", () => {
        expect(parseTokens("Bonjour {{2}}, votre commande {{1}} arrive le {{3}}.")).toEqual([1, 2, 3]);
    });

    it("dedupes a placeholder used twice", () => {
        expect(parseTokens("{{1}} puis encore {{1}}")).toEqual([1]);
    });

    it("tolerates inner whitespace", () => {
        expect(parseTokens("Salut {{ 1 }} !")).toEqual([1]);
    });
});

describe("splitTemplateBody", () => {
    it("returns [] for an empty body", () => {
        expect(splitTemplateBody("")).toEqual([]);
    });

    it("splits text and tokens in order, dropping empty fragments", () => {
        expect(splitTemplateBody("Bonjour {{1}}, à {{2}}")).toEqual([
            { text: "Bonjour ", token: null },
            { text: "{{1}}", token: 1 },
            { text: ", à ", token: null },
            { text: "{{2}}", token: 2 },
        ]);
    });

    it("handles a body that is only a token", () => {
        expect(splitTemplateBody("{{1}}")).toEqual([{ text: "{{1}}", token: 1 }]);
    });
});

describe("tokenLabel", () => {
    it("uses the example value when present", () => {
        expect(tokenLabel(1, ["Mehdi", "JK-2840A"])).toBe("Mehdi");
    });

    it("falls back to the raw placeholder when no example", () => {
        expect(tokenLabel(3, ["Mehdi"])).toBe("{{3}}");
        expect(tokenLabel(1, undefined)).toBe("{{1}}");
    });
});

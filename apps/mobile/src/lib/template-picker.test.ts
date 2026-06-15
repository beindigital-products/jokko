import { describe, expect, it } from "vitest";
import { templateBodyHasPlaceholders } from "./template-placeholders";

describe("templateBodyHasPlaceholders", () => {
    it("flags WhatsApp-style numeric placeholders", () => {
        expect(templateBodyHasPlaceholders("Hello {{1}}, welcome.")).toBe(true);
        expect(templateBodyHasPlaceholders("{{ 2 }}: order shipped")).toBe(true);
    });

    it("returns false for plain text", () => {
        expect(templateBodyHasPlaceholders("Bonjour, comment ça va ?")).toBe(false);
        expect(templateBodyHasPlaceholders("")).toBe(false);
    });

    it("does not match malformed braces", () => {
        expect(templateBodyHasPlaceholders("Hello {1}")).toBe(false);
        expect(templateBodyHasPlaceholders("Hello { {1} }")).toBe(false);
    });
});

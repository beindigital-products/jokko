import { describe, expect, it } from "vitest";
import { passwordStrength, validatePassword } from "./password-validation";

describe("validatePassword", () => {
    it("rejects passwords below 10 chars", () => {
        expect(validatePassword("Aa1").valid).toBe(false);
    });

    it("rejects passwords missing an uppercase", () => {
        expect(validatePassword("abcd1234567").valid).toBe(false);
    });

    it("rejects passwords missing a lowercase", () => {
        expect(validatePassword("ABCD1234567").valid).toBe(false);
    });

    it("rejects passwords missing a digit", () => {
        expect(validatePassword("Abcdefghijk").valid).toBe(false);
    });

    it("accepts a password meeting all rules", () => {
        expect(validatePassword("Abcdef12345").valid).toBe(true);
    });
});

describe("passwordStrength", () => {
    it("returns neutral score for empty input", () => {
        expect(passwordStrength("")).toEqual({
            score: 0,
            label: "Mot de passe",
            tone: "neutral",
        });
    });

    it("flags short alphanumerics as Faible", () => {
        const s = passwordStrength("Aa1");
        expect(s.tone).toBe("danger");
        expect(s.label).toBe("Faible");
    });

    it("flags 8-char alphanumerics with mixed case + digit as Moyen", () => {
        const s = passwordStrength("Abcdefg1");
        expect(s.score).toBeGreaterThanOrEqual(2);
        expect(s.tone).toBe("warning");
    });

    it("flags 12-char passwords with mixed case + digit as Bon", () => {
        const s = passwordStrength("Abcdefgh1234");
        expect(s.score).toBeGreaterThanOrEqual(3);
        expect(s.tone).toBe("success");
    });

    it("flags long passwords with symbols as Excellent", () => {
        const s = passwordStrength("Abcdefgh1234!@#");
        expect(s.score).toBe(4);
        expect(s.label).toBe("Excellent");
    });

    it("returns a score capped at 4", () => {
        const s = passwordStrength("Abcdefgh1234!@#$%^&*()");
        expect(s.score).toBe(4);
    });
});

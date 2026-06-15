import { describe, it, expect } from "vitest";
import { generateRegistrationPin } from "./registration";

describe("generateRegistrationPin", () => {
    it("always returns exactly 6 numeric digits (Meta rejects non-digit PINs)", () => {
        // Regression: the old impl used randomUUID() hex, which could contain
        // letters → Meta "Parameter pin must be a 6-digit string". Sample many
        // draws to catch any non-digit character.
        for (let i = 0; i < 500; i++) {
            expect(generateRegistrationPin()).toMatch(/^\d{6}$/);
        }
    });

    it("varies between calls", () => {
        const pins = new Set(Array.from({ length: 50 }, () => generateRegistrationPin()));
        // Astronomically unlikely to collide to a single value if truly random.
        expect(pins.size).toBeGreaterThan(1);
    });
});

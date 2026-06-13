import { describe, expect, it } from "vitest";
import { biometricLabel, parseAppLockEnabled, serializeAppLockEnabled } from "./app-lock";

describe("app-lock enabled flag", () => {
    it("parses 'true' as enabled", () => {
        expect(parseAppLockEnabled("true")).toBe(true);
    });

    it("parses anything else as disabled", () => {
        expect(parseAppLockEnabled("false")).toBe(false);
        expect(parseAppLockEnabled(null)).toBe(false);
        expect(parseAppLockEnabled(undefined)).toBe(false);
        expect(parseAppLockEnabled("")).toBe(false);
        expect(parseAppLockEnabled("1")).toBe(false);
    });

    it("round-trips through serialize", () => {
        expect(parseAppLockEnabled(serializeAppLockEnabled(true))).toBe(true);
        expect(parseAppLockEnabled(serializeAppLockEnabled(false))).toBe(false);
    });
});

describe("biometricLabel", () => {
    it("prefers Face ID when present", () => {
        expect(biometricLabel({ hasFace: true, hasFinger: true })).toBe("Face ID");
        expect(biometricLabel({ hasFace: true, hasFinger: false })).toBe("Face ID");
    });

    it("falls back to Touch ID", () => {
        expect(biometricLabel({ hasFace: false, hasFinger: true })).toBe("Touch ID");
    });

    it("uses a generic label when no biometrics", () => {
        expect(biometricLabel({ hasFace: false, hasFinger: false })).toBe("biométrie");
    });
});

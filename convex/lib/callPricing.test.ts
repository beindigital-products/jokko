import { describe, it, expect } from "vitest";
import {
    callRatePerMinuteFcfa,
    callCostFcfa,
    DEFAULT_CALL_RATE_FCFA_PER_MINUTE,
} from "./callPricing";

describe("callRatePerMinuteFcfa", () => {
    it("returns the Senegal rate for +221 numbers (formatted or raw)", () => {
        expect(callRatePerMinuteFcfa("+221 77 000 00 01")).toBe(10);
        expect(callRatePerMinuteFcfa("221770000001")).toBe(10);
    });

    it("covers the seeded UEMOA zone", () => {
        expect(callRatePerMinuteFcfa("+225 0700000000")).toBe(10); // Cote d'Ivoire
        expect(callRatePerMinuteFcfa("+229 90000000")).toBe(10); // Benin
    });

    it("falls back to the default rate for unlisted countries", () => {
        expect(callRatePerMinuteFcfa("+1 555 0100")).toBe(DEFAULT_CALL_RATE_FCFA_PER_MINUTE);
        expect(callRatePerMinuteFcfa("+33 6 12 93 17 79")).toBe(DEFAULT_CALL_RATE_FCFA_PER_MINUTE);
    });
});

describe("callCostFcfa", () => {
    it("bills per started minute (rounds up)", () => {
        expect(callCostFcfa("+221770000001", 30)).toBe(10); // 1 min
        expect(callCostFcfa("+221770000001", 60)).toBe(10); // exactly 1 min
        expect(callCostFcfa("+221770000001", 61)).toBe(20); // 2 min
        expect(callCostFcfa("+221770000001", 180)).toBe(30); // 3 min
    });

    it("does not bill unanswered / zero-duration calls", () => {
        expect(callCostFcfa("+221770000001", 0)).toBe(0);
        expect(callCostFcfa("+221770000001", undefined)).toBe(0);
    });
});

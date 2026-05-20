import { describe, expect, it } from "vitest";
import { parseFirstLaunchSeen, serializeFirstLaunchSeen } from "./first-launch";

describe("first launch persistence", () => {
    it("parses only explicit true as seen", () => {
        expect(parseFirstLaunchSeen("true")).toBe(true);
        expect(parseFirstLaunchSeen("false")).toBe(false);
        expect(parseFirstLaunchSeen(null)).toBe(false);
    });

    it("serializes first launch flags", () => {
        expect(serializeFirstLaunchSeen(true)).toBe("true");
        expect(serializeFirstLaunchSeen(false)).toBe("false");
    });
});

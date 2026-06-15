import { describe, it, expect } from "vitest";
import { AVATAR_TONES, avatarInitials, avatarTone, tint } from "./kit-utils";

describe("tint", () => {
  it("converts #rrggbb to rgba with the given alpha", () => {
    expect(tint("#138A4E", 0.14)).toBe("rgba(19, 138, 78, 0.14)");
    expect(tint("#FFFFFF", 1)).toBe("rgba(255, 255, 255, 1)");
    expect(tint("#000000", 0)).toBe("rgba(0, 0, 0, 0)");
  });

  it("passes non-6-digit-hex values through unchanged (e.g. already rgba)", () => {
    expect(tint("rgba(255,255,255,0.08)", 0.5)).toBe("rgba(255,255,255,0.08)");
    expect(tint("#FFF", 0.5)).toBe("#FFF");
  });
});

describe("avatarInitials", () => {
  it("takes the first letter of up to two words, uppercased", () => {
    expect(avatarInitials("Mamadou Seck")).toBe("MS");
    expect(avatarInitials("aminata")).toBe("A");
    expect(avatarInitials("Be in Digital")).toBe("BI"); // first two words only
  });

  it("handles empty and whitespace-heavy names", () => {
    expect(avatarInitials("")).toBe("");
    expect(avatarInitials("   ")).toBe("");
  });
});

describe("avatarTone", () => {
  it("is deterministic and within the palette", () => {
    const a = avatarTone("Mamadou Seck");
    expect(a).toBe(avatarTone("Mamadou Seck"));
    expect(AVATAR_TONES).toContain(a);
  });

  it("spreads different names across the palette", () => {
    const names = ["Alice", "Bob", "Charlie", "Diallo", "Fatou", "Ousmane", "Awa", "Khadija"];
    const tones = new Set(names.map(avatarTone));
    expect(tones.size).toBeGreaterThan(1);
  });
});

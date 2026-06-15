import { describe, expect, it } from "vitest";
import { getMessage, normalizeLocale, selectBestLocale, translate } from "./index";

describe("@jokko/i18n", () => {
  it("normalizes supported locales", () => {
    expect(normalizeLocale("fr-FR")).toBe("fr");
    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale("es-ES")).toBe("fr");
  });

  it("selects the first supported device locale", () => {
    expect(selectBestLocale(["es-ES", "en-GB"])).toBe("en");
    expect(selectBestLocale(["fr-FR", "en-US"])).toBe("fr");
  });

  it("returns nested messages with interpolation", () => {
    expect(getMessage("fr", "privacy.title")).toBe("Confidentialité");
    expect(translate("app.name", "en")).toBe("Jokko");
  });
});

import { describe, it, expect } from "vitest";
import { canSubmitAuthForm, looksLikeEmail } from "./auth-form";

describe("looksLikeEmail", () => {
  it("accepts a normal address (and trims surrounding spaces)", () => {
    expect(looksLikeEmail("ines@atelier.fr")).toBe(true);
    expect(looksLikeEmail("  ines@atelier.fr  ")).toBe(true);
  });

  it("rejects malformed addresses", () => {
    expect(looksLikeEmail("")).toBe(false);
    expect(looksLikeEmail("ines")).toBe(false);
    expect(looksLikeEmail("ines@")).toBe(false);
    expect(looksLikeEmail("ines@atelier")).toBe(false);
    expect(looksLikeEmail("ines atelier@x.fr")).toBe(false);
  });
});

describe("canSubmitAuthForm — sign-up (locked until everything is filled)", () => {
  const ok = {
    mode: "sign-up" as const,
    email: "ines@atelier.fr",
    password: "Motdepasse1", // ≥10, upper, lower, digit
    acceptedTerms: true,
  };

  it("enabled only when email valid + password valid + terms checked", () => {
    expect(canSubmitAuthForm(ok)).toBe(true);
  });

  it("stays disabled until the terms box is checked", () => {
    expect(canSubmitAuthForm({ ...ok, acceptedTerms: false })).toBe(false);
  });

  it("stays disabled while the password fails the requirements", () => {
    expect(canSubmitAuthForm({ ...ok, password: "short" })).toBe(false); // too short
    expect(canSubmitAuthForm({ ...ok, password: "motdepasse1" })).toBe(false); // no uppercase
    expect(canSubmitAuthForm({ ...ok, password: "MOTDEPASSE1" })).toBe(false); // no lowercase
    expect(canSubmitAuthForm({ ...ok, password: "Motdepasse" })).toBe(false); // no digit
  });

  it("stays disabled while the email is invalid", () => {
    expect(canSubmitAuthForm({ ...ok, email: "ines" })).toBe(false);
    expect(canSubmitAuthForm({ ...ok, email: "" })).toBe(false);
  });
});

describe("canSubmitAuthForm — sign-in (just both fields)", () => {
  it("enabled with both fields filled — no terms / strength gate", () => {
    expect(
      canSubmitAuthForm({ mode: "sign-in", email: "x@y.fr", password: "anything", acceptedTerms: false }),
    ).toBe(true);
  });

  it("disabled when a field is empty", () => {
    expect(canSubmitAuthForm({ mode: "sign-in", email: "", password: "x", acceptedTerms: false })).toBe(false);
    expect(canSubmitAuthForm({ mode: "sign-in", email: "x@y.fr", password: "", acceptedTerms: false })).toBe(false);
  });
});

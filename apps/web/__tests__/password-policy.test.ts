import { describe, expect, it } from "vitest"
import {
  PASSWORD_CRITERIA,
  PASSWORD_LEVEL_LABEL,
  PASSWORD_MIN_LENGTH,
  evaluatePassword,
} from "@/lib/password-policy"

describe("password-policy — single source of truth", () => {
  it("enforces 10-char minimum (matches convex/auth.ts:36)", () => {
    expect(PASSWORD_MIN_LENGTH).toBe(10)
    expect(PASSWORD_CRITERIA[0].test("a".repeat(9))).toBe(false)
    expect(PASSWORD_CRITERIA[0].test("a".repeat(10))).toBe(true)
  })

  it("declares exactly 4 criteria — no special char (matches convex/auth.ts:36-47)", () => {
    expect(PASSWORD_CRITERIA).toHaveLength(4)
    expect(PASSWORD_CRITERIA.map((c) => c.id)).toEqual([
      "length",
      "lowercase",
      "uppercase",
      "number",
    ])
  })

  it("does NOT require a special character", () => {
    const allCriteriaPass = "Abcdefghij1" // 11 chars, upper+lower+digit, NO special
    const result = evaluatePassword(allCriteriaPass)
    expect(result.isValid).toBe(true)
    expect(result.score).toBe(4)
  })
})

describe("evaluatePassword — level mapping per multi-agent review H2", () => {
  it("returns empty level for empty input", () => {
    expect(evaluatePassword("").level).toBe("empty")
    expect(evaluatePassword("").score).toBe(0)
    expect(evaluatePassword("").isValid).toBe(false)
  })

  it("returns weak for 1–2 passed criteria", () => {
    expect(evaluatePassword("abc").level).toBe("weak") // only lowercase passes
    expect(evaluatePassword("abc123").level).toBe("weak") // lower + digit = 2
  })

  it("returns medium for 3 passed criteria", () => {
    expect(evaluatePassword("Abc123").level).toBe("medium") // upper + lower + digit = 3
  })

  it("returns strong ONLY for all 4 criteria (FORT reserved for backend-accepting)", () => {
    expect(evaluatePassword("Abcdefghij1").level).toBe("strong") // length 11 + upper + lower + digit = 4
    expect(evaluatePassword("Abcdefghij1").isValid).toBe(true)
  })

  it("medium does NOT pass backend — strength meter does not lie", () => {
    const ev = evaluatePassword("Abc12345") // 8 char, has upper/lower/digit but length fails
    expect(ev.score).toBe(3)
    expect(ev.level).toBe("medium")
    expect(ev.isValid).toBe(false)
  })

  it("percentage maps to score / maxScore × 100", () => {
    expect(evaluatePassword("").percentage).toBe(0)
    expect(evaluatePassword("a").percentage).toBe(25)
    expect(evaluatePassword("aA").percentage).toBe(50)
    expect(evaluatePassword("aA1").percentage).toBe(75)
    expect(evaluatePassword("aA1abcdefg").percentage).toBe(100)
  })

  it("passed/failed arrays are disjoint and union covers all criteria", () => {
    const ev = evaluatePassword("Abc12345") // length fails
    expect(ev.failed).toContain("length")
    expect(ev.passed).toContain("uppercase")
    expect(ev.passed).toContain("lowercase")
    expect(ev.passed).toContain("number")
    expect(new Set([...ev.passed, ...ev.failed]).size).toBe(4)
  })
})

describe("PASSWORD_LEVEL_LABEL", () => {
  it("maps levels to French UI strings", () => {
    expect(PASSWORD_LEVEL_LABEL.empty).toBe("")
    expect(PASSWORD_LEVEL_LABEL.weak).toBe("Faible")
    expect(PASSWORD_LEVEL_LABEL.medium).toBe("Moyen")
    expect(PASSWORD_LEVEL_LABEL.strong).toBe("Fort")
  })
})

import { describe, expect, it } from "vitest"
import { safeRedirect } from "@/lib/safe-redirect"

describe("safeRedirect()", () => {
  describe("safe inputs — returns the path", () => {
    it.each([
      "/",
      "/dashboard",
      "/dashboard/conversations",
      "/dashboard/conversations/conv_abc123",
      "/dashboard?filter=unread",
      "/dashboard#section",
      "/team/members",
    ])("accepts %s", (input) => {
      expect(safeRedirect(input)).toBe(input)
    })
  })

  describe("falsy / empty — returns fallback", () => {
    it.each([null, undefined, "", "   ", "\t\n"])(
      "rejects %p",
      (input) => {
        expect(safeRedirect(input as never)).toBe("/dashboard")
      }
    )
  })

  describe("protocol-relative / scheme injection — returns fallback", () => {
    it.each([
      "//evil.com",
      "//evil.com/login",
      "/\\evil.com",
      "http://evil.com",
      "https://evil.com",
      "HTTP://evil.com",
      "javascript:alert(1)",
      "JavaScript:alert(1)",
      "data:text/html,<script>",
      "vbscript:msgbox",
      "file:///etc/passwd",
      "about:blank",
    ])("rejects %s", (input) => {
      expect(safeRedirect(input)).toBe("/dashboard")
    })
  })

  describe("URL-encoded payloads — decodes before validating", () => {
    it("rejects single-encoded //evil.com", () => {
      expect(safeRedirect("%2F%2Fevil.com")).toBe("/dashboard")
    })
    it("rejects double-encoded //evil.com", () => {
      expect(safeRedirect("%252F%252Fevil.com")).toBe("/dashboard")
    })
    it("rejects encoded javascript:", () => {
      expect(safeRedirect("javascript%3Aalert%281%29")).toBe("/dashboard")
    })
  })

  describe("internal infra paths — returns fallback", () => {
    it.each([
      "/api/",
      "/api/auth/session",
      "/_next/static/x.js",
      "/auth/sign-in",
      "/auth/sign-in?redirect=/dashboard",
      "/auth/sign-up",
      "/auth/forgot-password",
      "/auth/reset-password",
    ])("rejects %s", (input) => {
      expect(safeRedirect(input)).toBe("/dashboard")
    })
  })

  describe("non-string types — returns fallback", () => {
    it("rejects numbers, arrays, objects", () => {
      expect(safeRedirect(42 as never)).toBe("/dashboard")
      expect(safeRedirect([] as never)).toBe("/dashboard")
      expect(safeRedirect({} as never)).toBe("/dashboard")
    })
  })

  describe("invalid decode — returns fallback", () => {
    it("returns fallback on malformed URI sequence", () => {
      expect(safeRedirect("%E0%A4%A")).toBe("/dashboard")
    })
  })
})

import { describe, expect, it } from "vitest"
import { navKeyFromPathname, hiddenNavKeysForRole } from "../nav"

describe("navKeyFromPathname", () => {
    it("maps the dashboard root to tableau-de-bord", () => {
        expect(navKeyFromPathname("/dashboard")).toBe("tableau-de-bord")
        expect(navKeyFromPathname("/dashboard/")).toBe("tableau-de-bord")
    })

    it("maps each section route to its key", () => {
        expect(navKeyFromPathname("/dashboard/conversations")).toBe("conversations")
        expect(navKeyFromPathname("/dashboard/conversations/abc123")).toBe("conversations")
        expect(navKeyFromPathname("/dashboard/assignments")).toBe("assignations")
        expect(navKeyFromPathname("/dashboard/contacts")).toBe("contacts")
        expect(navKeyFromPathname("/dashboard/modeles")).toBe("modeles")
        expect(navKeyFromPathname("/dashboard/campagnes/new")).toBe("campagnes")
        expect(navKeyFromPathname("/dashboard/automatisations")).toBe("automatisations")
        expect(navKeyFromPathname("/dashboard/integrations")).toBe("integrations")
        expect(navKeyFromPathname("/dashboard/team")).toBe("equipe")
        expect(navKeyFromPathname("/dashboard/analytics")).toBe("analytics")
        expect(navKeyFromPathname("/dashboard/settings")).toBe("reglages")
        expect(navKeyFromPathname("/dashboard/billing")).toBe("facturation")
    })

    it("maps the dedicated mentions page to mentions", () => {
        expect(navKeyFromPathname("/dashboard/mentions")).toBe("mentions")
    })

    it("maps the notifications history to its own dedicated key", () => {
        expect(navKeyFromPathname("/dashboard/notifications")).toBe("notifications")
    })

    it("does not confuse contacts with conversations", () => {
        expect(navKeyFromPathname("/dashboard/contacts")).not.toBe("conversations")
    })

    it("honours a custom basePath", () => {
        expect(navKeyFromPathname("/app/contacts", "/app")).toBe("contacts")
    })
})

describe("hiddenNavKeysForRole", () => {
    it("hides admin-only sections for AGENT", () => {
        const hidden = hiddenNavKeysForRole("AGENT")
        expect(hidden).toContain("campagnes")
        expect(hidden).toContain("facturation")
        expect(hidden).toContain("equipe")
        expect(hidden).not.toContain("conversations")
        expect(hidden).not.toContain("mentions")
        expect(hidden).not.toContain("contacts")
    })

    it("hides nothing for OWNER / ADMIN / unknown", () => {
        expect(hiddenNavKeysForRole("OWNER")).toEqual([])
        expect(hiddenNavKeysForRole("ADMIN")).toEqual([])
        expect(hiddenNavKeysForRole(undefined)).toEqual([])
    })
})

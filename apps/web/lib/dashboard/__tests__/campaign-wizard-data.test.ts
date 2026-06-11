import { describe, expect, it } from "vitest"

import {
    buildCampaignWizardData,
    broadcastToWizardInitial,
    mapWizardTemplate,
    segToAudienceConfig,
    type AudienceOptions,
    type ChannelDoc,
} from "../campaign-wizard-data"
import type { TemplateDoc } from "../templates-data"

const NOW = new Date(2026, 5, 4).getTime()

function tpl(over: Partial<TemplateDoc> = {}): TemplateDoc {
    return {
        _id: "t1",
        name: "Devis envoyé",
        category: "MARKETING",
        language: "fr",
        status: "APPROVED",
        body: "Bonjour {{1}}, votre devis {{2}} est prêt.",
        footer: "— L'équipe",
        buttons: [{ type: "URL", text: "Voir" }],
        header: { type: "DOCUMENT" },
        ...over,
    }
}

const audience: AudienceOptions = { all: 2408, tags: [{ id: "tag_vip", name: "VIP", count: 38 }] }
const channels: ChannelDoc[] = [{ _id: "ch1", label: "Paris", displayPhoneNumber: "+33 1 84 60 12 88", status: "active" }]

describe("segToAudienceConfig", () => {
    it("maps 'all' and 'tag:<id>' to an audienceConfig", () => {
        expect(segToAudienceConfig("all")).toEqual({ type: "ALL" })
        expect(segToAudienceConfig("tag:abc123")).toEqual({ type: "TAGS", tags: ["abc123"] })
    })
})

describe("mapWizardTemplate", () => {
    it("maps an approved marketing template (vars, header, buttons)", () => {
        const w = mapWizardTemplate(tpl())!
        expect(w.cat).toBe("Marketing")
        expect(w.vars).toEqual([
            { token: "{{1}}", src: "first" },
            { token: "{{2}}", src: "fixed", fixed: "" },
        ])
        expect(w.header).toEqual({ type: "doc", label: "document.pdf", pages: 2, size: "240 ko" })
        expect(w.buttons).toEqual(["Voir"])
    })

    it("returns null for non-broadcastable categories (AUTHENTICATION)", () => {
        expect(mapWizardTemplate(tpl({ category: "AUTHENTICATION" }))).toBeNull()
    })
})

describe("buildCampaignWizardData", () => {
    it("returns null when there is no approved template", () => {
        expect(
            buildCampaignWizardData({ templates: [tpl({ status: "DRAFT" })], audience, channels, balance: 100 }, NOW),
        ).toBeNull()
    })

    it("returns null when there is no active channel", () => {
        expect(
            buildCampaignWizardData(
                { templates: [tpl()], audience, channels: [{ ...channels[0], status: "disabled" }], balance: 100 },
                NOW,
            ),
        ).toBeNull()
    })

    it("builds segments (all + tags), numbers and initial defaults", () => {
        const data = buildCampaignWizardData({ templates: [tpl()], audience, channels, balance: 100 }, NOW)!
        expect(data.templates).toHaveLength(1)
        expect(data.segments.map((s) => s.id)).toEqual(["all", "tag:tag_vip"])
        expect(data.segments[0].total).toBe(2408)
        expect(data.numbers).toEqual([{ id: "ch1", label: "Paris", num: "+33 1 84 60 12 88", quality: "—" }])
        expect(data.initial.tplId).toBe("t1")
        expect(data.initial.segId).toBe("all")
        expect(data.initial.date).toMatch(/^\d{4}-\d{2}-\d{2}$/) // a future YYYY-MM-DD
    })
})

describe("broadcastToWizardInitial (edit a draft)", () => {
    const data = buildCampaignWizardData({ templates: [tpl()], audience, channels, balance: 100 }, NOW)!

    it("reverse-maps an ALL / immediate draft", () => {
        const init = broadcastToWizardInitial(
            { name: "Promo", templateId: "t1", audienceConfig: { type: "ALL" } },
            data,
        )
        expect(init.name).toBe("Promo")
        expect(init.tplId).toBe("t1")
        expect(init.cat).toBe("Marketing")
        expect(init.segId).toBe("all")
        expect(init.numId).toBe("ch1")
        expect(init.mode).toBe("now")
    })

    it("reverse-maps a TAGS / scheduled draft (segId + local date/time round-trip)", () => {
        const when = new Date(2026, 6, 15, 9, 30).getTime() // local
        const init = broadcastToWizardInitial(
            {
                name: "VIP", templateId: "t1",
                audienceConfig: { type: "TAGS", tags: ["tag_vip"] },
                scheduledAt: when, whatsappChannelId: "ch1",
            },
            data,
        )
        expect(init.segId).toBe("tag:tag_vip")
        expect(init.mode).toBe("scheduled")
        expect(init.date).toBe("2026-07-15")
        expect(init.time).toBe("09:30")
        // round-trips back to the same instant
        expect(new Date(`${init.date}T${init.time}`).getTime()).toBe(when)
    })

    it("falls back to defaults when the referenced template is gone", () => {
        const init = broadcastToWizardInitial(
            { name: "Old", templateId: "gone", audienceConfig: { type: "ALL" } },
            data,
        )
        expect(init.tplId).toBe(data.initial.tplId)
        expect(init.cat).toBe(data.initial.cat)
    })
})

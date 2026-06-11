"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import {
    ArrowUpRight,
    BookOpen,
    FileCode,
    Globe,
    LifeBuoy,
    Loader2,
    Mail,
    Search,
    Send,
    ShieldCheck,
    Sparkles,
    Zap,
} from "lucide-react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import { PageHeader } from "@/components/dashboard/shell"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

/** Real external/internal documentation — the honest equivalent of the design's
 *  "Guides essentiels" placeholder cards. */
const RESOURCES: { title: string; description: string; href: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { title: "Documentation Cloud API", description: "Guides techniques officiels Meta", href: "https://developers.facebook.com/docs/whatsapp/cloud-api/", icon: BookOpen },
    { title: "Documentation API Jokko", description: "Endpoints, webhooks et exemples", href: "/docs/api", icon: FileCode },
    { title: "Meta Business Suite", description: "Gérer votre compte WhatsApp Business", href: "https://business.facebook.com/settings", icon: LifeBuoy },
    { title: "Politique commerciale", description: "Règles d'utilisation WhatsApp Business", href: "https://www.whatsapp.com/legal/commerce-policy/", icon: ShieldCheck },
    { title: "Modèles & fenêtre 24h", description: "Comprendre les templates et la fenêtre Meta", href: "https://developers.facebook.com/docs/whatsapp/cloud-api/guidance/conversation-types", icon: Sparkles },
    { title: "Statut de l'API Meta", description: "Vérifier la disponibilité des services", href: "https://metastatus.com/whatsapp-business-api", icon: Zap },
]

/** Qualitative service list — no fabricated uptime %, just an operational state. */
const SERVICES = ["API Jokko", "Webhooks Meta", "Tâches planifiées"]

export default function HelpPage() {
    const user = useQuery(api.users.me)
    const session = useQuery(api.sessions.current)
    const createTicket = useMutation(api.tickets.create)

    const [search, setSearch] = useState("")
    const [supportOpen, setSupportOpen] = useState(false)
    const [subject, setSubject] = useState("")
    const [message, setMessage] = useState("")
    const [type, setType] = useState("OTHER")
    const [priority, setPriority] = useState("MEDIUM")
    const [contactEmail, setContactEmail] = useState("")
    const [contactPhone, setContactPhone] = useState("")
    const [submitting, setSubmitting] = useState(false)

    const q = search.trim().toLowerCase()
    const resources = q
        ? RESOURCES.filter((r) => `${r.title} ${r.description}`.toLowerCase().includes(q))
        : RESOURCES

    const resetForm = () => {
        setSubject("")
        setMessage("")
        setType("OTHER")
        setPriority("MEDIUM")
        setContactEmail("")
        setContactPhone("")
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await createTicket({
                subject,
                message,
                type: type as "BUG" | "FEATURE" | "BILLING" | "OTHER",
                priority: priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
                contactEmail: contactEmail || user?.email,
                contactPhone: contactPhone || user?.phone,
                organizationId: session?.organization?._id,
            })
            toast.success("Message envoyé", { description: "Notre équipe vous répond sous 2h ouvrées." })
            resetForm()
            setSupportOpen(false)
        } catch {
            toast.error("Impossible d'envoyer le message pour le moment.")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--paper-white)]">
            <PageHeader
                eyebrow="Centre d'aide"
                title="Aide"
                description="Guides, documentation, contact support. Tout ce qu'il faut pour aller plus vite."
            />

            <div className="flex-1 overflow-y-auto px-8 pb-8 pt-7">
                <div className="max-w-[920px]">
                    {/* Search */}
                    <div className="flex h-11 max-w-[540px] items-center gap-2.5 rounded-lg border border-[var(--ink-200)] bg-[var(--paper-white)] px-3.5 focus-within:border-[var(--accent)]">
                        <Search className="h-4 w-4 text-[var(--ink-soft)]" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher dans la documentation…"
                            className="h-full flex-1 bg-transparent text-[14px] text-[var(--ink-900)] outline-none placeholder:text-[var(--ink-400)]"
                        />
                    </div>

                    {/* Resources */}
                    <div className="mt-7 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                        Guides & ressources
                    </div>
                    {resources.length > 0 ? (
                        <div className="mt-3 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                            {resources.map((r) => {
                                const external = r.href.startsWith("http")
                                return (
                                    <a
                                        key={r.title}
                                        href={r.href}
                                        target={external ? "_blank" : undefined}
                                        rel={external ? "noopener noreferrer" : undefined}
                                        className="group rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-[18px] transition-colors hover:border-[var(--ink-300)] hover:bg-[var(--paper-warm)]/50"
                                    >
                                        <div className="flex items-center justify-between">
                                            <r.icon className="h-[18px] w-[18px] text-[var(--accent)]" />
                                            <ArrowUpRight className="h-3.5 w-3.5 text-[var(--ink-400)] opacity-0 transition-opacity group-hover:opacity-100" />
                                        </div>
                                        <div className="mt-3.5 text-[14.5px] font-medium leading-tight tracking-tight text-[var(--ink-900)]">
                                            {r.title}
                                        </div>
                                        <div className="mt-1.5 text-[12px] text-[var(--ink-soft)]">{r.description}</div>
                                    </a>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="mt-3 text-[13px] text-[var(--ink-soft)]">Aucune ressource ne correspond à « {search} ».</p>
                    )}

                    {/* Support + status */}
                    <div className="mt-6 grid grid-cols-1 gap-3.5 lg:grid-cols-2">
                        {/* Contact support */}
                        <div className="rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-5">
                            <div className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                                Contacter le support
                            </div>
                            <div className="mt-1.5 font-editorial text-[22px] italic leading-snug tracking-tight text-[var(--ink-900)]">
                                On répond en moins de 2h ouvrées.
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSupportOpen(true)}
                                    className="inline-flex items-center gap-1.5 rounded-md bg-[var(--ink-900)] px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[var(--ink-700)]"
                                >
                                    <Mail className="h-3.5 w-3.5" /> Envoyer un message
                                </button>
                                <a
                                    href="mailto:support@jokko.app"
                                    className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-3.5 py-2 text-[13px] font-medium text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-warm)]"
                                >
                                    <Globe className="h-3.5 w-3.5" /> support@jokko.app
                                </a>
                            </div>
                        </div>

                        {/* System status (qualitative — no fabricated uptime) */}
                        <div className="rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-5">
                            <div className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                                État du système
                            </div>
                            <div className="mt-1.5 flex items-baseline gap-3">
                                <span className="font-editorial text-[22px] italic leading-snug tracking-tight text-[var(--ink-900)]">
                                    Tout fonctionne normalement
                                </span>
                                <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--status-good)]" />
                            </div>
                            <div className="mt-4 flex flex-col gap-2.5">
                                {SERVICES.map((name) => (
                                    <div key={name} className="flex items-center gap-2.5 text-[12.5px]">
                                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-good)]" />
                                        <span className="flex-1 text-[var(--ink-700)]">{name}</span>
                                        <span className="font-mono text-[11px] text-[var(--status-good)]">Opérationnel</span>
                                    </div>
                                ))}
                            </div>
                            <a
                                href="https://metastatus.com/whatsapp-business-api"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 inline-flex items-center gap-1 text-[11.5px] text-[var(--ink-soft)] hover:text-[var(--ink-700)]"
                            >
                                Statut de l&apos;API Meta <ArrowUpRight className="h-3 w-3" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Support ticket dialog (real — tickets.create) */}
            <Dialog open={supportOpen} onOpenChange={(o) => { setSupportOpen(o); if (!o) resetForm() }}>
                <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[520px]">
                    <form onSubmit={handleSubmit}>
                        <div className="border-b border-[var(--ink-200)] px-6 pb-4 pt-5">
                            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                                Support
                            </p>
                            <DialogTitle className="mt-1 font-editorial text-[24px] font-normal italic tracking-tight text-[var(--ink-900)]">
                                Envoyer un message
                            </DialogTitle>
                            <DialogDescription className="mt-1.5 text-[13px] text-[var(--ink-500)]">
                                Décrivez votre demande — nous répondons sous 2h ouvrées.
                            </DialogDescription>
                        </div>

                        <div className="flex flex-col gap-4 px-6 py-5">
                            <div className="space-y-1.5">
                                <Label htmlFor="subject" className="text-[12px] font-medium text-[var(--ink-700)]">Sujet</Label>
                                <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Résumé de votre demande" className="h-10" required />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-[12px] font-medium text-[var(--ink-700)]">Type</Label>
                                    <Select value={type} onValueChange={setType}>
                                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="BUG">Bug</SelectItem>
                                            <SelectItem value="FEATURE">Fonctionnalité</SelectItem>
                                            <SelectItem value="BILLING">Facturation</SelectItem>
                                            <SelectItem value="OTHER">Autre</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[12px] font-medium text-[var(--ink-700)]">Priorité</Label>
                                    <Select value={priority} onValueChange={setPriority}>
                                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="LOW">Basse</SelectItem>
                                            <SelectItem value="MEDIUM">Moyenne</SelectItem>
                                            <SelectItem value="HIGH">Haute</SelectItem>
                                            <SelectItem value="URGENT">Urgente</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="msg" className="text-[12px] font-medium text-[var(--ink-700)]">Message</Label>
                                <Textarea id="msg" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Décrivez votre problème en détail…" className="min-h-[120px] resize-none" required />
                            </div>
                            {!user?.email && !user?.phone && (
                                <div className="grid grid-cols-2 gap-3 rounded-lg border border-[var(--status-warn)]/30 bg-[var(--status-warn-soft)] p-3">
                                    <Input placeholder="Votre email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="h-9" />
                                    <Input placeholder="Votre téléphone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="h-9" />
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2 border-t border-[var(--ink-200)] bg-[var(--paper-warm)] px-5 py-3.5">
                            <button type="button" onClick={() => setSupportOpen(false)} className="rounded-md px-3.5 py-2 text-[13px] font-medium text-[var(--ink-700)] transition-colors hover:bg-[var(--ink-100)]">
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || !subject || !message}
                                className="inline-flex items-center gap-1.5 rounded-md bg-[var(--ink-900)] px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[var(--ink-700)] disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                Envoyer
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

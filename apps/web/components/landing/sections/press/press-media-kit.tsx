"use client";

import { motion } from "framer-motion";
import { Download, Image as ImageIcon, Palette, Type, Briefcase } from "lucide-react";

const assets = [
    {
        icon: Briefcase,
        title: "Logo pack",
        description:
            "SVG, PNG. Versions horizontale, compacte, monochrome. Fond clair et sombre.",
        size: "2.1 MB",
        format: "ZIP",
    },
    {
        icon: Palette,
        title: "Guide de marque",
        description:
            "Palette OKLCH, typographie Geist, espacements, règles d'utilisation du logo.",
        size: "4.8 MB",
        format: "PDF",
    },
    {
        icon: ImageIcon,
        title: "Captures produit",
        description:
            "12 screenshots haute résolution : inbox, flow builder, campagnes, analytics.",
        size: "28 MB",
        format: "ZIP",
    },
    {
        icon: Type,
        title: "Portraits fondateurs",
        description:
            "Photos HD de l'équipe dirigeante, libres de droits pour usage éditorial.",
        size: "14 MB",
        format: "ZIP",
    },
];

export function PressMediaKit() {
    return (
        <section className="relative border-y border-border/60 bg-[var(--surface-dark)] py-20 text-[var(--surface-dark-foreground)] md:py-24">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.06]"
                style={{
                    backgroundImage:
                        "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)",
                    backgroundSize: "28px 28px",
                }}
            />
            <div className="relative mx-auto max-w-7xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7 }}
                    className="mb-12 flex items-end justify-between gap-4"
                >
                    <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]">
                            Media kit
                        </p>
                        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
                            Téléchargez tout.
                        </h2>
                    </div>
                    <div
                        title="Bientôt disponible"
                        className="hidden cursor-default items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white/40 backdrop-blur md:inline-flex"
                    >
                        <Download className="h-4 w-4" />
                        Kit complet — Bientôt
                    </div>
                </motion.div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {assets.map((asset, i) => {
                        const Icon = asset.icon;
                        return (
                            <motion.div
                                key={asset.title}
                                title="Bientôt disponible"
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.15 }}
                                transition={{
                                    duration: 0.5,
                                    delay: i * 0.06,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-muted)] text-[var(--accent)]">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white/40">
                                        Bientôt
                                    </span>
                                </div>
                                <h3 className="mt-5 font-semibold text-white/70">
                                    {asset.title}
                                </h3>
                                <p className="mt-1.5 flex-1 text-xs leading-relaxed text-[var(--surface-dark-muted-foreground)]">
                                    {asset.description}
                                </p>
                                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 font-mono text-[10px] uppercase tracking-wider text-[var(--surface-dark-muted-foreground)]">
                                    <span>{asset.format}</span>
                                    <span>{asset.size}</span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

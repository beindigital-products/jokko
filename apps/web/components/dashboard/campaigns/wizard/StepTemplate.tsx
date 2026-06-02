import { Icon } from "@/components/dashboard/primitives/Icon"
import { CwLabel, type WizardState } from "./_shared"

/**
 * StepTemplate — Étape 2 (Modèle). Radio rows for the Meta-approved templates in
 * the chosen category. Each shows a check circle, name + "Approuvé" pill, a body
 * preview, and lang / variable-count pills. Selecting one re-binds the variables
 * and updates the rail preview. Controlled by the shell.
 */
export function StepTemplate({ data, cat, tplId, selectTpl }: WizardState) {
    const templatesInCat = data.templates.filter((t) => t.cat === cat)

    return (
        <div className="flex flex-col gap-2">
            <CwLabel hint={`${templatesInCat.length} modèles approuvés`}>Modèle · {cat}</CwLabel>
            {templatesInCat.map((t) => {
                const on = t.id === tplId
                return (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => selectTpl(t.id)}
                        className="flex items-center gap-3 rounded-[10px] border px-3.5 py-3 text-left transition-colors"
                        style={{
                            cursor: "pointer",
                            borderColor: on ? "var(--accent)" : "var(--ink-200)",
                            background: on ? "rgba(105,56,239,0.05)" : "var(--paper-white)",
                        }}
                    >
                        <span
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
                            style={{
                                borderColor: on ? "var(--accent)" : "var(--ink-300)",
                                background: on ? "var(--accent)" : "transparent",
                            }}
                        >
                            {on ? <Icon name="check" size={12} color="#fff" strokeWidth={2.6} /> : null}
                        </span>

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="text-[13.5px] font-semibold tracking-[-0.005em] text-[var(--ink-900)]">
                                    {t.name}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-md bg-[var(--status-good-soft)] px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.05em] text-[var(--status-good)]">
                                    <span className="h-1 w-1 rounded-full bg-[var(--status-good)]" />
                                    Approuvé
                                </span>
                            </div>
                            <div className="mt-[3px] truncate text-[12px] text-[var(--ink-soft)]">{t.body}</div>
                        </div>

                        <div className="flex shrink-0 gap-1.5">
                            <span className="rounded-md border border-[var(--ink-200)] bg-[var(--paper-warm)] px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.05em] text-[var(--ink-700)]">
                                {t.lang}
                            </span>
                            <span className="rounded-md border border-[var(--ink-200)] bg-[var(--paper-warm)] px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.05em] text-[var(--ink-700)]">
                                {t.vars.length} var.
                            </span>
                        </div>
                    </button>
                )
            })}
        </div>
    )
}

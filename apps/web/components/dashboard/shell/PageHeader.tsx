interface PageHeaderProps {
    eyebrow: string
    title: string
    description?: string
    actions?: React.ReactNode
}

/**
 * PageHeader — eyebrow (mono uppercase) + h1 display + description +
 * right-aligned actions slot. Sits at the top of every dashboard page.
 */
export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
    return (
        <div className="border-b border-[var(--ink-200)] px-8 pt-7 pb-5">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                        {eyebrow}
                    </p>
                    <h1 className="mt-1 font-display text-[28px] font-bold tracking-tight text-[var(--ink-900)]">
                        {title}
                    </h1>
                    {description ? (
                        <p className="mt-1.5 max-w-2xl text-sm text-[var(--ink-500)]">
                            {description}
                        </p>
                    ) : null}
                </div>
                {actions ? (
                    <div className="flex shrink-0 items-center gap-2">{actions}</div>
                ) : null}
            </div>
        </div>
    )
}

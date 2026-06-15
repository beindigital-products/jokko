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
        <div className="border-b border-[var(--ink-200)] px-4 pb-5 pt-5 sm:px-8 sm:pt-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 lg:flex-1">
                    <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                        {eyebrow}
                    </p>
                    <h1 className="mt-1 font-display text-[22px] font-bold tracking-tight text-[var(--ink-900)] sm:text-[28px]">
                        {title}
                    </h1>
                    {description ? (
                        <p className="mt-1.5 max-w-2xl text-sm text-[var(--ink-500)]">
                            {description}
                        </p>
                    ) : null}
                </div>
                {actions ? (
                    <div className="flex flex-wrap items-center gap-2 lg:shrink-0">{actions}</div>
                ) : null}
            </div>
        </div>
    )
}

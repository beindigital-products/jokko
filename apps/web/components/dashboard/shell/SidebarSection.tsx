interface SidebarSectionProps {
    label: string
    children: React.ReactNode
}

export function SidebarSection({ label, children }: SidebarSectionProps) {
    return (
        <div>
            <p className="px-2 pb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                {label}
            </p>
            <ul className="space-y-0.5">{children}</ul>
        </div>
    )
}

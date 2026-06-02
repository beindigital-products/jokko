/**
 * Tabs — underlined sub-navigation tabs.
 *
 * Documented in Storybook (Primitives · Tabs). Used for in-page section
 * switching (e.g. inbox filters). The active tab gets ink text plus a 1.5px
 * ink underline; inactive tabs are ink-soft. An optional mono count chip sits
 * after the label.
 */

export interface TabItem {
    label: string
    count?: number
    active?: boolean
}

export function Tabs({ items }: { items: TabItem[] }) {
    return (
        <div className="flex h-9 items-center gap-5">
            {items.map((item) => {
                const isActive = !!item.active
                return (
                    <button
                        key={item.label}
                        type="button"
                        className="relative flex h-9 items-center gap-1.5 font-medium text-[12.5px] outline-none"
                        style={{ color: isActive ? "var(--ink-900)" : "var(--ink-soft)" }}
                        aria-current={isActive ? "page" : undefined}
                    >
                        <span>{item.label}</span>
                        {item.count !== undefined && (
                            <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--paper-warm)] px-1.5 font-mono text-[10px] text-[var(--ink-500)] tabular-nums">
                                {item.count}
                            </span>
                        )}
                        {isActive && (
                            <span
                                className="absolute inset-x-0 -bottom-px h-[1.5px] rounded-full"
                                style={{ background: "var(--ink-900)" }}
                            />
                        )}
                    </button>
                )
            })}
        </div>
    )
}

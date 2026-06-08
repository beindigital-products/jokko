import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <div className="flex h-full w-full flex-col bg-[var(--paper-white)]">
            <div className="border-b border-[var(--ink-200)] px-8 pb-5 pt-7">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="mt-2 h-7 w-40" />
                <Skeleton className="mt-2 h-4 w-80" />
            </div>
            <div className="border-b border-[var(--ink-200)] px-8 py-6">
                <Skeleton className="h-3 w-16" />
                <div className="mt-3 flex gap-3">
                    {[0, 1, 2].map((i) => (
                        <Skeleton key={i} className="h-[58px] w-[220px] rounded-xl" />
                    ))}
                </div>
            </div>
            <div className="space-y-2 px-8 pt-4">
                {[0, 1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
        </div>
    )
}

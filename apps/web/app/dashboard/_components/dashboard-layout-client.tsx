'use client'

import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { BrowserNotifications } from '@/components/browser-notifications'
import { NotificationBanner } from '@/components/dashboard/notification-banner'
import { TrialBanner } from '@/components/billing/trial-banner'
import { CallNotificationProvider } from '@/components/calls/call-notification-provider'
import { usePresence } from '@/hooks/use-presence'
import { useCurrentOrg } from '@/hooks/use-current-org'
import { useTrialStatus } from '@/hooks/usePlans'
import { Id } from '@/convex/_generated/dataModel'

interface DashboardLayoutClientProps {
    children: React.ReactNode
    user?: {
        name: string
        email: string
        avatar?: string
        role?: string
    }
    organizationName?: string
    organizationSlug?: string
    organizationId?: string
}

export function DashboardLayoutClient({ children }: DashboardLayoutClientProps) {
    const basePath = '/dashboard'
    const { currentOrg } = useCurrentOrg()
    const { isTrialing, hasSelectedPlan, isLoading: trialLoading } = useTrialStatus()
    const showTopTrialBanner = !trialLoading && !hasSelectedPlan && !isTrialing
    // ^ trial expiré + pas de plan : on affiche le gros bandeau rouge en haut.

    // Send heartbeat on ALL dashboard pages (not just conversations)
    usePresence(currentOrg?._id as Id<"organizations"> | undefined)

    return (
        <SidebarProvider className="h-screen bg-gray-50/50">
            {/* Desktop sidebar (v3 on shadcn) + mobile off-canvas sheet */}
            <AppSidebar basePath={basePath} />

            {/* Main Content Area */}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                {/* Sidebar collapse / open — in the content column (not the sidebar) */}
                <div className="flex h-12 shrink-0 items-center px-3">
                    <SidebarTrigger
                        aria-label="Replier le menu"
                        className="size-8 text-[var(--ink-500)] hover:bg-[var(--paper-warm)] hover:text-[var(--ink-900)]"
                    />
                </div>
                <NotificationBanner />
                <BrowserNotifications />
                <CallNotificationProvider />

                {/* Page Content */}
                <main id="main-content" className="flex-1 overflow-y-auto" role="main">
                    <div className="p-3 sm:p-4 lg:p-6">
                        {showTopTrialBanner && (
                            <div className="mb-4">
                                <TrialBanner variant="page" />
                            </div>
                        )}
                        {children}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    )
}

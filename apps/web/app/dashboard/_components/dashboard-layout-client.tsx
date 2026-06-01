'use client'

import { DashboardHeader } from '@/components/dashboard'
import { AppSidebar } from '@/components/dashboard/app-sidebar'
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

export function DashboardLayoutClient({
    children,
    user,
    organizationName,
}: DashboardLayoutClientProps) {
    const basePath = '/dashboard'
    const { currentOrg } = useCurrentOrg()
    const { isTrialing, hasSelectedPlan, isLoading: trialLoading } = useTrialStatus()
    const showTopTrialBanner = !trialLoading && !hasSelectedPlan && !isTrialing
    // ^ trial expiré + pas de plan : on affiche le gros bandeau rouge en haut.

    // Send heartbeat on ALL dashboard pages (not just conversations)
    usePresence(currentOrg?._id as Id<"organizations"> | undefined)

    return (
        <div className="flex h-screen bg-gray-50/50">
            {/* Desktop Sidebar (v3) */}
            <nav className="hidden lg:block" aria-label="Navigation principale">
                <AppSidebar basePath={basePath} />
            </nav>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <NotificationBanner />
                <BrowserNotifications />
                <CallNotificationProvider />
                {/* Header with mobile sidebar */}
                <DashboardHeader
                    basePath={basePath}
                    user={user}
                    organizationName={organizationName}
                    showSearch={true}
                />

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
        </div>
    )
}

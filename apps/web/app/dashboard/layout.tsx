'use client';

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayoutClient } from "./_components/dashboard-layout-client";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = useQuery(api.users.me);
    const role = useQuery(api.users.currentUserRole);
    const sessionData = useQuery(api.sessions.current);
    const ensureSession = useMutation(api.sessions.ensure);
    const router = useRouter();

    // 1. Auth & Onboarding Redirect
    useEffect(() => {
        if (user === null) {
            router.push('/auth/sign-in');
            return;
        }
        if (user && user.onboardingCompleted !== true) {
            router.push('/onboarding');
            return;
        }
    }, [user, router]);

    // 2. Session Init (only after onboarding is complete)
    const [sessionRetries, setSessionRetries] = useState(0);
    useEffect(() => {
        if (sessionData === null && user && user.onboardingCompleted === true) {
            if (sessionRetries >= 3) {
                router.push('/onboarding');
                return;
            }
            ensureSession()
                .then((result) => {
                    if (!result) {
                        setSessionRetries((r) => r + 1);
                    }
                })
                .catch(() => {
                    setSessionRetries((r) => r + 1);
                });
        }
    }, [sessionData, user, ensureSession, sessionRetries, router]);

    // 3. Subdomain Redirect — OPT-IN only.
    //
    // The tenant is resolved from the session (userSessions.currentOrganizationId),
    // NOT from the host — so this redirect is purely cosmetic. It also BREAKS auth:
    // `window.location.href` to `{slug}.<root>` is a new origin, and the Convex
    // auth token cookie is host-only on localhost (no `domain` attribute, see
    // ConvexClientProvider), so the token isn't carried over → user becomes null
    // → bounce back to /auth/sign-in. It also adds a slow full-page reload.
    //
    // Disabled by default. Enable only once cross-subdomain cookie sharing is
    // verified end-to-end (cookie `domain=.<root>` matching NEXT_PUBLIC_ROOT_DOMAIN,
    // TLS cert covering the wildcard). Never on localhost (host-only cookies + the
    // dev `--experimental-https` cert only covers `localhost`).
    useEffect(() => {
        if (process.env.NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING !== 'true') return;
        if (!sessionData?.organization?.slug) return;
        if (user?.onboardingCompleted !== true) return;

        const hostname = window.location.hostname;
        if (hostname.includes('localhost')) return; // never on localhost

        const slug = sessionData.organization.slug;
        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'jokko.co';

        // Preserve query params (critical for payment redirects like ?session=...&status=...)
        const fullPath = window.location.pathname + window.location.search;

        if (hostname === rootDomain || hostname === `www.${rootDomain}`) {
            window.location.href = `${window.location.protocol}//${slug}.${rootDomain}${fullPath}`;
        }
    }, [sessionData, user]);

    // -----------------------------------------------------
    // RENDERING STATES
    // -----------------------------------------------------

    // A. Initial Loading (Skeleton)
    // Avoids flashing dashboard before we know user status
    if (user === undefined || sessionData === undefined) {
        return (
            <div className="flex h-screen bg-gray-50/50">
                <div className="hidden lg:block w-72 border-r border-gray-200/80 bg-white h-full p-4 space-y-6">
                    <div className="px-2 mb-6">
                        <Skeleton className="h-8 w-32" />
                    </div>
                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Skeleton key={i} className="h-10 w-full rounded-xl" />
                        ))}
                    </div>
                </div>
                <div className="flex-1 flex flex-col overflow-hidden">
                    <header className="h-16 border-b border-gray-200/80 bg-white/80 backdrop-blur-xl px-6 flex items-center justify-between">
                        <Skeleton className="h-6 w-48" />
                        <div className="flex gap-3">
                            <Skeleton className="h-9 w-9 rounded-full" />
                            <Skeleton className="h-9 w-9 rounded-full" />
                        </div>
                    </header>
                    <main className="flex-1 p-6 space-y-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} className="h-32 rounded-xl" />
                            ))}
                        </div>
                        <div className="grid gap-6 lg:grid-cols-2">
                            <Skeleton className="h-96 rounded-xl" />
                            <Skeleton className="h-96 rounded-xl" />
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    // B. Not Logged In
    if (user === null) {
        return null;
    }

    // C. Needs Onboarding
    if (user.onboardingCompleted !== true) {
        return (
            <div className="flex h-screen items-center justify-center flex-col gap-2 bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-gray-500">Redirection vers l&apos;onboarding...</span>
            </div>
        );
    }

    // D. Missing/Creating Organization
    if (!sessionData?.organization) {
        return (
            <div className="flex h-screen items-center justify-center flex-col gap-2 bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-gray-500">Connexion à votre espace...</span>
            </div>
        );
    }

    // E. Ready
    return (
        <DashboardLayoutClient
            user={user ? {
                name: user.name ?? 'User',
                email: user.email ?? '',
                avatar: user.image,
                role: role ?? 'Member'
            } : undefined}
            organizationName={sessionData?.organization?.name}
            organizationSlug={sessionData?.organization?.slug}
            organizationId={sessionData?.organization?._id}
        >
            {children}
        </DashboardLayoutClient>
    );
}

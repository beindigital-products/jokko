"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = useQuery(api.users.me);
    const router = useRouter();

    useEffect(() => {
        if (user === null) {
            router.push('/auth/sign-in');
            return;
        }
        if (user && user.onboardingCompleted) {
            router.push('/dashboard');
        }
    }, [user, router]);

    if (user === undefined) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[var(--paper-warm)]">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--paper-warm)]">
            {children}
        </div>
    );
}

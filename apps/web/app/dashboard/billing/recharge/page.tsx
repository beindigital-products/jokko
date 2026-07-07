import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { RechargeContent } from "./_recharge-content";

function RechargeLoading() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--paper-white)] shadow-sm">
                <div className="flex flex-col items-center space-y-4 px-8 pb-8 pt-8 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-sm">
                        <Loader2 className="h-7 w-7 animate-spin" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-base font-semibold text-[var(--ink-900)]">Chargement</h2>
                        <p className="text-sm text-[var(--ink-soft)]">Vérification de votre paiement…</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function RechargePage() {
    return (
        <Suspense fallback={<RechargeLoading />}>
            <RechargeContent />
        </Suspense>
    );
}

import type { Metadata } from "next"
import { Suspense } from "react"
import ResetPasswordContent from "./content"

export const metadata: Metadata = {
  title: "Réinitialiser le mot de passe — Jokko",
  description: "Choisissez un nouveau mot de passe pour votre espace Jokko.",
}

export default function ResetPasswordPage() {
  // ResetPasswordContent reads useSearchParams(); it must sit under a Suspense
  // boundary or Next.js fails to prerender this public page (CSR bailout).
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  )
}

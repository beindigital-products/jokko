import type { Metadata } from "next"
import ResetPasswordContent from "./content"

export const metadata: Metadata = {
  title: "Réinitialiser le mot de passe — Jokko",
  description: "Choisissez un nouveau mot de passe pour votre espace Jokko.",
}

export default function ResetPasswordPage() {
  return <ResetPasswordContent />
}

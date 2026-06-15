import type { Metadata } from "next"
import ForgotPasswordContent from "./content"

export const metadata: Metadata = {
  title: "Mot de passe oublié — Jokko",
  description: "Réinitialisez votre mot de passe Jokko en un clic.",
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordContent />
}

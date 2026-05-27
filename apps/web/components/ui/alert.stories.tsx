import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "./alert"

const meta = {
  title: "Primitives/Alert",
  component: Alert,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "v2 cream variants (error / success / warn / info) + legacy default & destructive. Convention : tile is always paired with a lucide icon as first child + AlertTitle + optional AlertDescription.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "destructive",
        "error-cream",
        "success-cream",
        "warn-cream",
        "info-cream",
      ],
    },
  },
  args: { variant: "error-cream" },
  tags: ["autodocs"],
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const ErrorCream: Story = {
  render: (args) => (
    <Alert {...args}>
      <AlertCircle />
      <AlertTitle>Email ou mot de passe incorrect</AlertTitle>
      <AlertDescription>
        Vérifiez vos identifiants ou réinitialisez votre mot de passe.
      </AlertDescription>
    </Alert>
  ),
}

export const SuccessCream: Story = {
  args: { variant: "success-cream" },
  render: (args) => (
    <Alert {...args}>
      <CheckCircle2 />
      <AlertTitle>Modèle approuvé</AlertTitle>
      <AlertDescription>
        Votre modèle WhatsApp peut maintenant être envoyé.
      </AlertDescription>
    </Alert>
  ),
}

export const WarnCream: Story = {
  args: { variant: "warn-cream" },
  render: (args) => (
    <Alert {...args}>
      <TriangleAlert />
      <AlertTitle>Connexion lente détectée</AlertTitle>
      <AlertDescription>
        Mode allégé activé. Forcer la qualité complète ?
      </AlertDescription>
    </Alert>
  ),
}

export const InfoCream: Story = {
  args: { variant: "info-cream" },
  render: (args) => (
    <Alert {...args}>
      <Info />
      <AlertTitle>Astuce</AlertTitle>
      <AlertDescription>
        Tapez « / » dans le composer pour ouvrir les raccourcis.
      </AlertDescription>
    </Alert>
  ),
}

export const Default: Story = {
  args: { variant: "default" },
  render: (args) => (
    <Alert {...args}>
      <Info />
      <AlertTitle>Default (legacy)</AlertTitle>
      <AlertDescription>Plain neutral alert without coloring.</AlertDescription>
    </Alert>
  ),
}

export const Destructive: Story = {
  args: { variant: "destructive" },
  render: (args) => (
    <Alert {...args}>
      <AlertCircle />
      <AlertTitle>Destructive (legacy)</AlertTitle>
      <AlertDescription>Use error-cream for v2 forms.</AlertDescription>
    </Alert>
  ),
}

export const AllCreamVariants: Story = {
  render: () => (
    <div className="grid max-w-3xl gap-3 sm:grid-cols-2">
      <Alert variant="error-cream">
        <AlertCircle />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>Email ou mot de passe incorrect.</AlertDescription>
      </Alert>
      <Alert variant="success-cream">
        <CheckCircle2 />
        <AlertTitle>Succès</AlertTitle>
        <AlertDescription>Modèle approuvé.</AlertDescription>
      </Alert>
      <Alert variant="warn-cream">
        <TriangleAlert />
        <AlertTitle>Avertissement</AlertTitle>
        <AlertDescription>Connexion lente détectée.</AlertDescription>
      </Alert>
      <Alert variant="info-cream">
        <Info />
        <AlertTitle>Info</AlertTitle>
        <AlertDescription>Tapez « / » pour les raccourcis.</AlertDescription>
      </Alert>
    </div>
  ),
}

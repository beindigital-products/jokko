import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ArrowRight } from "lucide-react"
import { Button } from "./button"
import { Input } from "./input"
import { Label } from "./label"
import { PageShellAuth } from "./page-shell-auth"

const meta = {
  title: "Shells/PageShellAuth",
  component: PageShellAuth,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Full-bleed wrapper for v2 auth / onboarding / banner surfaces. `loud` intensity = hot-pink ; `soft` = paper-warm. The inner Card stacks a violet mat over a white inner card.",
      },
    },
  },
  argTypes: {
    intensity: { control: "radio", options: ["loud", "soft"] },
  },
  args: { intensity: "loud" },
  tags: ["autodocs"],
} satisfies Meta<typeof PageShellAuth>

export default meta
type Story = StoryObj<typeof meta>

function DemoCard() {
  return (
    <PageShellAuth.Card width="md">
      <div className="flex flex-col gap-6">
        <Label variant="eyebrow" asChild>
          <p>Connexion · Espace équipe</p>
        </Label>
        <h1 className="font-editorial text-4xl tracking-tight">Bon retour.</h1>
        <p className="text-sm text-[var(--ink-500)]">
          Reprenez votre espace équipe.
        </p>
        <div className="space-y-3">
          <div>
            <Label variant="eyebrow" htmlFor="sb-pse-email">
              E-mail
            </Label>
            <Input
              id="sb-pse-email"
              type="email"
              placeholder="vous@entreprise.com"
              className="mt-1.5"
            />
          </div>
          <Button variant="accent" size="xl" className="w-full">
            Accéder à mon espace
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </PageShellAuth.Card>
  )
}

export const Loud: Story = {
  args: { intensity: "loud" },
  render: (args) => (
    <PageShellAuth {...args}>
      <DemoCard />
    </PageShellAuth>
  ),
}

export const Soft: Story = {
  args: { intensity: "soft" },
  render: (args) => (
    <PageShellAuth {...args}>
      <DemoCard />
    </PageShellAuth>
  ),
}

export const SmallCard: Story = {
  args: { intensity: "loud" },
  render: () => (
    <PageShellAuth>
      <PageShellAuth.Card width="sm">
        <p className="font-eyebrow">Récupération</p>
        <h1 className="mt-2 font-editorial text-2xl">On vous renvoie ça.</h1>
        <Button variant="accent" size="lg" className="mt-6 w-full">
          Envoyer le lien
        </Button>
      </PageShellAuth.Card>
    </PageShellAuth>
  ),
}

export const LargeCard: Story = {
  args: { intensity: "loud" },
  render: () => (
    <PageShellAuth>
      <PageShellAuth.Card width="lg">
        <p className="font-eyebrow">Nouveau compte</p>
        <h1 className="mt-2 font-editorial text-4xl">Votre inbox équipe.</h1>
        <Button variant="accent" size="xl" className="mt-6 w-full">
          Créer mon espace
        </Button>
      </PageShellAuth.Card>
    </PageShellAuth>
  ),
}

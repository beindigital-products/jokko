import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ArrowRight, Loader2 } from "lucide-react"
import { Button } from "./button"

const meta = {
  title: "Primitives/Button",
  component: Button,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "shadcn Button extended with v2 design-system variants. Use `accent` for new primary CTAs ; `mono-link` for inline secondary navigation (mot de passe oublié etc.) ; legacy `default` (near-black) kept for back-compat.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "accent",
        "destructive",
        "outline",
        "secondary",
        "ghost",
        "link",
        "mono-link",
      ],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "xl", "icon", "icon-sm", "icon-lg"],
    },
  },
  args: { children: "Accéder à mon espace", variant: "accent", size: "default" },
  tags: ["autodocs"],
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Accent: Story = {}

export const AccentXL: Story = {
  args: { size: "xl", children: "Accéder à mon espace" },
}

export const Default: Story = {
  args: { variant: "default", children: "Default (legacy)" },
}

export const Destructive: Story = {
  args: { variant: "destructive", children: "Supprimer" },
}

export const Outline: Story = {
  args: { variant: "outline", children: "Outline" },
}

export const Secondary: Story = {
  args: { variant: "secondary", children: "Secondary" },
}

export const Ghost: Story = {
  args: { variant: "ghost", children: "Ghost" },
}

export const Link: Story = {
  args: { variant: "link", children: "Link" },
}

export const MonoLink: Story = {
  args: { variant: "mono-link", children: "Mot de passe oublié ?" },
}

export const WithIcon: Story = {
  args: {
    variant: "accent",
    size: "xl",
    children: (
      <>
        Continuer
        <ArrowRight className="h-4 w-4" />
      </>
    ),
  },
}

export const Loading: Story = {
  args: {
    variant: "accent",
    disabled: true,
    children: (
      <>
        <Loader2 className="h-4 w-4 animate-spin" />
        Connexion…
      </>
    ),
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="default">Default</Button>
      <Button variant="accent">Accent</Button>
      <Button variant="accent" size="xl">Accent xl</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="mono-link">Mot de passe oublié ?</Button>
    </div>
  ),
}

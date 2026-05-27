import type { Preview } from "@storybook/nextjs-vite"
import "../app/globals.css"

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "paper-warm",
      values: [
        { name: "paper-warm", value: "#FBF9F5" },
        { name: "paper-white", value: "#FFFFFF" },
        { name: "ink-900", value: "#1A1814" },
        { name: "accent", value: "#693BEF" },
        { name: "accent-hot-pink", value: "#FF60B4" },
      ],
    },
    layout: "padded",
    options: {
      storySort: {
        order: [
          "Tokens",
          ["Colors", "Typography"],
          "Primitives",
          ["Button", "Input", "Label", "Alert", "PasswordInput", "PasswordStrength", "OAuthButton"],
          "Onboarding",
          ["OnboardingProgress"],
        ],
      },
    },
  },
}

export default preview

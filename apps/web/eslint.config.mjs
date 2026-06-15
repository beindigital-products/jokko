import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      // French UI copy is full of apostrophes/quotes; escaping them adds no value
      // (React renders text content correctly regardless).
      "react/no-unescaped-entities": "off",
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
    },
  },
  {
    // Storybook story render() functions legitimately call hooks (useState, etc.);
    // the rules-of-hooks linter can't recognise a story render as a component.
    files: ["**/*.stories.tsx", "**/*.stories.ts"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Stale orphan: the real Convex backend lives at the repo root (convex/),
    // reached via the @/convex/* path alias. This local copy is generated noise.
    "convex/**",
  ]),
]);

export default eslintConfig;

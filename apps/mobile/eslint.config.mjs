import tseslint from "typescript-eslint";
import noConsolePii from "./eslint-rules/no-console-pii.cjs";
import noUiLiteralString from "./eslint-rules/no-ui-literal-string.cjs";

export default [
    {
        ignores: [
            ".expo/**",
            "node_modules/**",
            "ios/**",
            "android/**",
            "dist/**",
            "build/**",
        ],
    },
    {
        files: ["**/*.{js,jsx,ts,tsx}"],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                ecmaFeatures: { jsx: true },
            },
        },
        plugins: {
            jokko: {
                rules: {
                    "no-console-pii": noConsolePii,
                    "no-ui-literal-string": noUiLiteralString,
                },
            },
        },
        rules: {
            "jokko/no-console-pii": "error",
        },
    },
    {
        files: ["app/**/*.tsx", "src/PrivacyConsentGate.tsx"],
        rules: {
            "jokko/no-ui-literal-string": "error",
        },
    },
];

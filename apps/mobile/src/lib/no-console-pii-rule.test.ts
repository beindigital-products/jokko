import { RuleTester } from "eslint";
import { describe, it } from "vitest";

// @ts-ignore local CommonJS ESLint rule used by the mobile flat config.
import noConsolePii from "../../eslint-rules/no-console-pii.cjs";
// @ts-ignore local CommonJS ESLint rule used by the mobile flat config.
import noUiLiteralString from "../../eslint-rules/no-ui-literal-string.cjs";

describe("Spike S6 — no-console-pii ESLint rule", () => {
    it("flags obvious PII in console calls", () => {
        const tester = new RuleTester({
            languageOptions: {
                ecmaVersion: 2022,
                sourceType: "module",
            },
        });

        tester.run("no-console-pii", noConsolePii as any, {
            valid: [
                "console.log('message sent');",
                "console.info({ conversationId, status });",
                "console.warn('retry count', retryCount);",
                "logger.info({ messageId, organizationId });",
            ],
            invalid: [
                {
                    code: "console.log('user@example.com');",
                    errors: [{ messageId: "noConsolePii" }],
                },
                {
                    code: "console.warn(customerPhone);",
                    errors: [{ messageId: "noConsolePii" }],
                },
                {
                    code: "console.error({ text: 'private WhatsApp body' });",
                    errors: [{ messageId: "noConsolePii" }],
                },
                {
                    code: "console.debug(`sending to ${recipientEmail}`);",
                    errors: [{ messageId: "noConsolePii" }],
                },
                {
                    code: "console.log({ ...contact });",
                    errors: [{ messageId: "noConsolePii" }],
                },
            ],
        });
    });
});

describe("L1 — no-ui-literal-string ESLint rule", () => {
    it("flags visible JSX text in routed UI", () => {
        const tester = new RuleTester({
            languageOptions: {
                ecmaVersion: 2022,
                sourceType: "module",
                parserOptions: { ecmaFeatures: { jsx: true } },
            },
        });

        tester.run("no-ui-literal-string", noUiLiteralString as any, {
            valid: [
                "const view = <Text>{t('inbox.readyTitle')}</Text>;",
                "const view = <View><Text>{label}</Text></View>;",
            ],
            invalid: [
                {
                    code: "const view = <Text>Inbox prête</Text>;",
                    errors: [{ messageId: "noUiLiteralString" }],
                },
            ],
        });
    });
});

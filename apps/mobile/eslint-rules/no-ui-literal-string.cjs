function isMeaningfulText(value) {
    return value.replace(/\s+/g, "").length > 0;
}

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Prevent hardcoded JSX text in routed mobile UI",
        },
        schema: [],
        messages: {
            noUiLiteralString:
                "Do not hardcode visible UI text in routed mobile screens. Use @jokko/i18n translations.",
        },
    },
    create(context) {
        return {
            JSXText(node) {
                if (isMeaningfulText(node.value)) {
                    context.report({
                        node,
                        messageId: "noUiLiteralString",
                    });
                }
            },
        };
    },
};

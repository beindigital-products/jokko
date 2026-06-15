const PII_STRING_REGEX = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|(\+?\d[\d\s().-]{6,}\d)|(wamid\.[A-Za-z0-9+/=]+)/;
const SENSITIVE_NAME_REGEX = /(email|phone|telephone|mobile|whatsapp|waid|recipient|contact|customer|client|password|secret|token|authorization|cookie|messagebody|message_body|body|content|text)/i;
const SAFE_IDENTIFIER_REGEX = /(id|ids|count|status|type|kind|role|plan|version|duration|timestamp|createdat|updatedat|lastseenat|expiresat)$/i;

function getPropertyName(node) {
    if (!node) return null;
    if (node.type === "Identifier") return node.name;
    if (node.type === "Literal") return String(node.value);
    if (node.type === "PrivateIdentifier") return node.name;
    return null;
}

function getCalleeName(callee) {
    if (!callee || callee.type !== "MemberExpression") return null;
    const objectName = getPropertyName(callee.object);
    const propertyName = getPropertyName(callee.property);
    if (objectName !== "console" || !propertyName) return null;
    return propertyName;
}

function isSafeIdentifierName(name) {
    const normalized = name.toLowerCase();
    if (normalized === "id") return true;
    return SAFE_IDENTIFIER_REGEX.test(normalized);
}

function isSensitiveIdentifierName(name) {
    return SENSITIVE_NAME_REGEX.test(name) && !isSafeIdentifierName(name);
}

function literalContainsPii(node) {
    return typeof node.value === "string" && PII_STRING_REGEX.test(node.value);
}

function templateContainsPii(node) {
    return node.quasis.some((quasi) => PII_STRING_REGEX.test(quasi.value.raw));
}

function nodeLooksSensitive(node) {
    if (!node) return false;

    switch (node.type) {
        case "Identifier":
            return isSensitiveIdentifierName(node.name);
        case "Literal":
            return literalContainsPii(node);
        case "TemplateLiteral":
            return templateContainsPii(node) || node.expressions.some(nodeLooksSensitive);
        case "MemberExpression": {
            const propertyName = getPropertyName(node.property);
            return Boolean(propertyName && isSensitiveIdentifierName(propertyName));
        }
        case "ObjectExpression":
            return node.properties.some((property) => {
                if (property.type === "SpreadElement") return true;
                const keyName = getPropertyName(property.key);
                return Boolean(
                    (keyName && isSensitiveIdentifierName(keyName)) ||
                    nodeLooksSensitive(property.value),
                );
            });
        case "ArrayExpression":
            return node.elements.some(nodeLooksSensitive);
        case "CallExpression":
            return node.arguments.some(nodeLooksSensitive);
        case "ConditionalExpression":
            return nodeLooksSensitive(node.consequent) || nodeLooksSensitive(node.alternate);
        case "BinaryExpression":
        case "LogicalExpression":
            return nodeLooksSensitive(node.left) || nodeLooksSensitive(node.right);
        default:
            return false;
    }
}

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Prevent logging obvious PII through console.* calls",
        },
        schema: [],
        messages: {
            noConsolePii:
                "Do not log possible PII with console. Use structured, redacted observability helpers instead.",
        },
    },
    create(context) {
        return {
            CallExpression(node) {
                const consoleMethod = getCalleeName(node.callee);
                if (!["log", "info", "warn", "error", "debug", "trace"].includes(consoleMethod || "")) {
                    return;
                }

                if (node.arguments.some(nodeLooksSensitive)) {
                    context.report({
                        node,
                        messageId: "noConsolePii",
                    });
                }
            },
        };
    },
};

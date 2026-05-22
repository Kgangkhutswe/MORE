"use strict";
const context_1 = require("../styles/context");
module.exports = {
    meta: {
        docs: {
            description: "disallow parsing errors in `<style>`",
            categories: ["recommended", "vue3-recommended"],
            default: "warn",
            url: "https://future-architect.github.io/eslint-plugin-vue-scoped-css/rules/no-parsing-error.html",
        },
        fixable: null,
        messages: { parsingError: "Parsing error: {{message}}." },
        schema: [],
        type: "problem",
    },
    create(context) {
        const styles = (0, context_1.getStyleContexts)(context);
        if (!styles.length) {
            return {};
        }
        const reporter = (0, context_1.getCommentDirectivesReporter)(context);
        function report(node) {
            reporter.report({
                node,
                loc: node.loc.start,
                messageId: "parsingError",
                data: {
                    message: node.message.endsWith(".")
                        ? node.message.slice(0, -1)
                        : node.message,
                },
            });
        }
        function reportInvalidStyle(style) {
            reporter.report({
                node: style.styleElement,
                loc: style.invalid.loc,
                messageId: "parsingError",
                data: {
                    message: style.invalid.message,
                },
            });
        }
        return {
            "Program:exit"() {
                var _a;
                for (const style of styles) {
                    if (style.invalid != null) {
                        if (style.invalid.needReport) {
                            reportInvalidStyle(style);
                        }
                    }
                    else {
                        for (const node of ((_a = style.cssNode) === null || _a === void 0 ? void 0 : _a.errors) || []) {
                            report(node);
                        }
                    }
                }
            },
        };
    },
};

"use strict";
const context_1 = require("../styles/context");
const selectors_1 = require("../styles/utils/selectors");
module.exports = {
    meta: {
        docs: {
            description: "disallow parent selector for `::v-global` pseudo-element",
            categories: ["vue3-recommended"],
            default: "warn",
            url: "https://future-architect.github.io/eslint-plugin-vue-scoped-css/rules/no-parent-of-v-global.html",
        },
        fixable: null,
        messages: {
            unexpected: "The parent selector of the `::v-global()` pseudo-element is useless.",
        },
        schema: [],
        type: "suggestion",
    },
    create(context) {
        const styles = (0, context_1.getStyleContexts)(context)
            .filter(context_1.isValidStyleContext)
            .filter((style) => style.scoped);
        if (!styles.length) {
            return {};
        }
        const reporter = (0, context_1.getCommentDirectivesReporter)(context);
        function report(node) {
            reporter.report({
                node,
                loc: node.loc,
                messageId: "unexpected",
            });
        }
        function verify(style) {
            style.traverseSelectorNodes({
                enterNode(node) {
                    if (!(0, selectors_1.isVGlobalPseudo)(node)) {
                        return;
                    }
                    const nodes = node.parent.nodes;
                    const selectorIndex = nodes.indexOf(node);
                    if (selectorIndex > 0) {
                        report(node);
                    }
                },
            });
        }
        return {
            "Program:exit"() {
                for (const style of styles) {
                    verify(style);
                }
            },
        };
    },
};

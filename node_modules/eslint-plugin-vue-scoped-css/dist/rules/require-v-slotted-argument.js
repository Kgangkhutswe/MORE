"use strict";
const context_1 = require("../styles/context");
const selectors_1 = require("../styles/utils/selectors");
module.exports = {
    meta: {
        docs: {
            description: "require selector argument to be passed to `::v-slotted()`",
            categories: ["vue3-recommended"],
            default: "warn",
            url: "https://future-architect.github.io/eslint-plugin-vue-scoped-css/rules/require-v-slotted-argument.html",
        },
        fixable: null,
        messages: {
            missingArguments: "Need to pass argument to the `::v-slotted` pseudo-element.",
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
                messageId: "missingArguments",
            });
        }
        function verify(style) {
            style.traverseSelectorNodes({
                enterNode(node) {
                    if ((0, selectors_1.isVSlottedPseudo)(node) && (0, selectors_1.isPseudoEmptyArguments)(node)) {
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

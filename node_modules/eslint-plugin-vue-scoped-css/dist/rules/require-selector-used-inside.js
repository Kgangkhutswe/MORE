"use strict";
const selectors_1 = require("../styles/selectors");
const selectors_2 = require("../styles/utils/selectors");
const query_1 = require("../styles/selectors/query");
const context_1 = require("../styles/context");
const utils_1 = require("../utils/utils");
const options_1 = require("../options");
const style_1 = require("../styles/context/style");
function getScopedSelectors(style) {
    const resolvedSelectors = (0, selectors_1.getResolvedSelectors)(style);
    return resolvedSelectors.map(getScopedSelector).filter(utils_1.isDefined);
}
function getScopedSelector(resolvedSelector) {
    const { selector } = resolvedSelector;
    const specialNodeIndex = selector.findIndex((s) => (0, selectors_2.isDeepCombinator)(s) || (0, selectors_2.isVueSpecialPseudo)(s));
    if (specialNodeIndex >= 0) {
        const specialNode = selector[specialNodeIndex];
        if ((0, selectors_2.isDeepCombinator)(specialNode) || (0, selectors_2.isVDeepPseudo)(specialNode)) {
            const scopedCandidateSelector = selector.slice(0, specialNodeIndex);
            const last = scopedCandidateSelector.pop();
            if (last && !(0, selectors_2.isDescendantCombinator)(last)) {
                scopedCandidateSelector.push(last);
            }
            return scopedCandidateSelector;
        }
        else if ((0, selectors_2.isVSlottedPseudo)(specialNode)) {
            return selector.slice(0, specialNodeIndex + 1);
        }
        else if ((0, selectors_2.isVGlobalPseudo)(specialNode)) {
            return null;
        }
        return [...selector];
    }
    return [...selector];
}
module.exports = {
    meta: {
        docs: {
            description: "disallow selectors defined that is not used inside `<template>`",
            categories: [],
            default: "warn",
            url: "https://future-architect.github.io/eslint-plugin-vue-scoped-css/rules/require-selector-used-inside.html",
        },
        fixable: null,
        messages: {
            unused: "The selector `{{selector}}` is unused in the template.",
        },
        schema: [
            {
                type: "object",
                properties: {
                    ignoreBEMModifier: {
                        type: "boolean",
                    },
                    captureClassesFromDoc: {
                        type: "array",
                        items: [
                            {
                                type: "string",
                            },
                        ],
                        minItems: 0,
                        uniqueItems: true,
                    },
                    checkUnscoped: {
                        type: "boolean",
                    },
                },
                additionalProperties: false,
            },
        ],
        type: "suggestion",
    },
    create(context) {
        var _a;
        if (!(0, utils_1.hasTemplateBlock)(context)) {
            return {};
        }
        const checkUnscoped = Boolean((_a = context.options[0]) === null || _a === void 0 ? void 0 : _a.checkUnscoped);
        const styles = (0, context_1.getStyleContexts)(context)
            .filter(style_1.isValidStyleContext)
            .filter((style) => style.scoped || checkUnscoped);
        if (!styles.length) {
            return {};
        }
        const reporter = (0, context_1.getCommentDirectivesReporter)(context);
        const reportedSet = new Set();
        function report(nodes) {
            const last = nodes[nodes.length - 1];
            if (!reportedSet.has(last)) {
                reporter.report({
                    loc: {
                        start: nodes[0].loc.start,
                        end: last.loc.end,
                    },
                    messageId: "unused",
                    data: {
                        selector: nodes.map((n) => n.selector).join(""),
                    },
                });
                reportedSet.add(last);
            }
        }
        function verifySelector(queryContext, scopedSelector) {
            let targetsQueryContext = queryContext;
            const selectorNodes = scopedSelector
                .filter((s) => (0, selectors_2.isSelectorCombinator)(s) ||
                (0, selectors_2.isTypeSelector)(s) ||
                (0, selectors_2.isIDSelector)(s) ||
                (0, selectors_2.isClassSelector)(s) ||
                (0, selectors_2.isUniversalSelector)(s) ||
                (0, selectors_2.isVueSpecialPseudo)(s));
            for (let index = 0; index < selectorNodes.length; index++) {
                const selectorNode = selectorNodes[index];
                targetsQueryContext = targetsQueryContext.queryStep(selectorNode);
                if (!targetsQueryContext.elements.length) {
                    report(selectorNodes.slice(0, index + 1));
                    break;
                }
            }
        }
        return {
            "Program:exit"() {
                const queryContext = (0, query_1.createQueryContext)(context, (0, options_1.parseQueryOptions)(context.options[0]));
                for (const style of styles) {
                    for (const scopedSelector of getScopedSelectors(style)) {
                        verifySelector(queryContext, scopedSelector);
                    }
                }
            },
        };
    },
};

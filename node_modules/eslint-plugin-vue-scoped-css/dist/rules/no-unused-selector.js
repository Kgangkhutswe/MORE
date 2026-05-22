"use strict";
const selectors_1 = require("../styles/selectors");
const selectors_2 = require("../styles/utils/selectors");
const query_1 = require("../styles/selectors/query");
const elements_1 = require("../styles/selectors/query/elements");
const options_1 = require("../options");
const context_1 = require("../styles/context");
const utils_1 = require("../utils/utils");
const style_1 = require("../styles/context/style");
function getScopedSelectors(style) {
    const resolvedSelectors = (0, selectors_1.getResolvedSelectors)(style);
    return resolvedSelectors.map(getScopedSelector).filter(utils_1.isDefined);
}
function getScopedSelector(resolvedSelector) {
    const { selector } = resolvedSelector;
    const specialNodeIndex = selector.findIndex((s) => (0, selectors_2.isDeepCombinator)(s) || (0, selectors_2.isVueSpecialPseudo)(s));
    let scopedCandidateSelector;
    if (specialNodeIndex >= 0) {
        const specialNode = selector[specialNodeIndex];
        if ((0, selectors_2.isDeepCombinator)(specialNode) || (0, selectors_2.isVDeepPseudo)(specialNode)) {
            scopedCandidateSelector = selector.slice(0, specialNodeIndex);
            const last = scopedCandidateSelector.pop();
            if (last && !(0, selectors_2.isDescendantCombinator)(last)) {
                scopedCandidateSelector.push(last);
            }
        }
        else if ((0, selectors_2.isVSlottedPseudo)(specialNode)) {
            scopedCandidateSelector = selector.slice(0, specialNodeIndex + 1);
        }
        else if ((0, selectors_2.isVGlobalPseudo)(specialNode)) {
            return null;
        }
        else {
            scopedCandidateSelector = [...selector];
        }
    }
    else {
        scopedCandidateSelector = [...selector];
    }
    const results = [];
    for (const sel of scopedCandidateSelector.reverse()) {
        if ((0, selectors_2.isSelectorCombinator)(sel)) {
            if (!(0, selectors_2.isChildCombinator)(sel) &&
                !(0, selectors_2.isAdjacentSiblingCombinator)(sel) &&
                !(0, selectors_2.isGeneralSiblingCombinator)(sel)) {
                break;
            }
        }
        results.push(sel);
    }
    return results.reverse();
}
module.exports = {
    meta: {
        docs: {
            description: "disallow selectors defined in Scoped CSS that don't use in `<template>`",
            categories: ["recommended", "vue3-recommended"],
            default: "warn",
            url: "https://future-architect.github.io/eslint-plugin-vue-scoped-css/rules/no-unused-selector.html",
        },
        fixable: null,
        messages: {
            unused: "The selector `{{selector}}` is unused.",
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
            if (!reportedSet.has(nodes[0])) {
                reporter.report({
                    loc: {
                        start: nodes[0].loc.start,
                        end: nodes[nodes.length - 1].loc.end,
                    },
                    messageId: "unused",
                    data: {
                        selector: nodes.map((n) => n.selector).join(""),
                    },
                });
                reportedSet.add(nodes[0]);
            }
        }
        function verifySelector(queryContext, scopedSelector) {
            const reportSelectorNodes = [];
            let targetsQueryContext = queryContext;
            let reverseVerifySelector = [...scopedSelector].reverse();
            while (reverseVerifySelector.length) {
                const combIndex = reverseVerifySelector.findIndex(selectors_2.isSelectorCombinator);
                let comb = null;
                let selectorBlock = [];
                if (combIndex >= 0) {
                    comb = reverseVerifySelector[combIndex];
                    selectorBlock = reverseVerifySelector.slice(0, combIndex);
                    reverseVerifySelector = reverseVerifySelector.slice(combIndex + 1);
                }
                else {
                    selectorBlock = reverseVerifySelector;
                    reverseVerifySelector = [];
                }
                const classSelectors = selectorBlock.filter(selectors_2.isClassSelector);
                const notClassSelectors = selectorBlock.filter((s) => (0, selectors_2.isSelectorCombinator)(s) ||
                    (0, selectors_2.isTypeSelector)(s) ||
                    (0, selectors_2.isIDSelector)(s) ||
                    (0, selectors_2.isUniversalSelector)(s) ||
                    (0, selectors_2.isVueSpecialPseudo)(s));
                for (const selectorNode of notClassSelectors) {
                    targetsQueryContext =
                        targetsQueryContext.reverseQueryStep(selectorNode);
                }
                const roots = targetsQueryContext.filter(elements_1.isRootElement);
                if (roots.elements.length) {
                    for (const selectorNode of classSelectors) {
                        if (roots.reverseQueryStep(selectorNode).elements.length) {
                            return;
                        }
                    }
                }
                for (const selectorNode of classSelectors) {
                    targetsQueryContext =
                        targetsQueryContext.reverseQueryStep(selectorNode);
                }
                reportSelectorNodes.push(...selectorBlock);
                if (comb) {
                    if (!targetsQueryContext.elements.length) {
                        break;
                    }
                    if (targetsQueryContext.elements.some(elements_1.isRootElement)) {
                        return;
                    }
                    targetsQueryContext = targetsQueryContext.reverseQueryStep(comb);
                    reportSelectorNodes.push(comb);
                }
            }
            if (!targetsQueryContext.elements.length) {
                report(reportSelectorNodes.reverse());
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

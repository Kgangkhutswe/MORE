"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findNextNestingSelector = exports.ResolvedSelector = exports.SCSSSelectorResolver = void 0;
const selectors_1 = require("../../utils/selectors");
const ast_1 = require("../../ast");
const css_selector_resolver_1 = require("./css-selector-resolver");
Object.defineProperty(exports, "ResolvedSelector", { enumerable: true, get: function () { return css_selector_resolver_1.ResolvedSelector; } });
class SCSSSelectorResolver extends css_selector_resolver_1.CSSSelectorResolver {
    resolveNestingSelectors(owner, selectorNodes, parentSelectors, container) {
        if ((0, selectors_1.isNestingAtRule)(container)) {
            return this.resolveSelectorForNestContaining(owner, selectorNodes, (0, selectors_1.findNestingSelector)(selectorNodes), parentSelectors, container);
        }
        return this.resolveSelectorForSCSSNesting(owner, selectorNodes, parentSelectors, container);
    }
    resolveSelectorForSCSSNesting(owner, selectorNodes, parentSelectors, container) {
        const nesting = (0, selectors_1.findNestingSelector)(selectorNodes);
        if (nesting != null) {
            let resolvedSelectors = this.resolveSelectorForNestContaining(owner, selectorNodes, nesting, parentSelectors, container);
            let hasNesting = true;
            while (hasNesting) {
                hasNesting = false;
                const nextResolvedSelectors = [];
                for (const resolvedSelector of resolvedSelectors) {
                    const nextNesting = findNextNestingSelector(resolvedSelector, container);
                    if (nextNesting) {
                        hasNesting = true;
                        nextResolvedSelectors.push(...this.resolveSelectorForNestContaining(owner, resolvedSelector.selector, nextNesting, parentSelectors, container));
                    }
                }
                if (!hasNesting) {
                    break;
                }
                resolvedSelectors = nextResolvedSelectors;
            }
            return resolvedSelectors;
        }
        const first = selectorNodes[0];
        if ((0, selectors_1.isSelectorCombinator)(first)) {
            return this.resolveSelectorForNestConcat(owner, selectorNodes, parentSelectors, container);
        }
        const comb = new ast_1.VCSSSelectorCombinator(first.node, {
            start: first.loc.start,
            end: first.loc.start,
        }, first.range[0], first.range[0], first.parent);
        comb.value = " ";
        comb.selector = " ";
        return this.resolveSelectorForNestConcat(owner, [comb, ...selectorNodes], parentSelectors, container);
    }
}
exports.SCSSSelectorResolver = SCSSSelectorResolver;
function findNextNestingSelector(resolved, container) {
    for (const nest of (0, selectors_1.findNestingSelectors)(resolved.selector)) {
        let parent = nest.node.parent;
        while (parent &&
            parent.type !== "VCSSAtRule" &&
            parent.type !== "VCSSStyleRule") {
            parent = parent.parent;
        }
        if (parent === container) {
            return nest;
        }
    }
    return null;
}
exports.findNextNestingSelector = findNextNestingSelector;

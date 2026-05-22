"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findNextNestingSelector = exports.ResolvedSelector = exports.StylusSelectorResolver = void 0;
const selectors_1 = require("../../utils/selectors");
const ast_1 = require("../../ast");
const css_selector_resolver_1 = require("./css-selector-resolver");
Object.defineProperty(exports, "ResolvedSelector", { enumerable: true, get: function () { return css_selector_resolver_1.ResolvedSelector; } });
class StylusSelectorResolver extends css_selector_resolver_1.CSSSelectorResolver {
    resolveNestingSelectors(owner, selectorNodes, parentSelectors, container) {
        if ((0, selectors_1.isNestingAtRule)(container)) {
            return this.resolveSelectorForNestContaining(owner, selectorNodes, (0, selectors_1.findNestingSelector)(selectorNodes), parentSelectors, container);
        }
        return this.resolveSelectorForStylusNesting(owner, selectorNodes, parentSelectors, container);
    }
    resolveSelectorForStylusNesting(owner, selectorNodes, parentSelectors, container) {
        const nesting = (0, selectors_1.findNestingSelector)(selectorNodes);
        if (nesting != null) {
            const nestingParent = parentSelectors
                ? this.getNestingParentSelectors(parentSelectors, nesting)
                : null;
            let resolvedSelectors = this.resolveSelectorForNestContaining(owner, selectorNodes, nesting, nestingParent, container);
            let hasNesting = true;
            while (hasNesting) {
                hasNesting = false;
                const nextResolvedSelectors = [];
                for (const resolvedSelector of resolvedSelectors) {
                    const nextNesting = findNextNestingSelector(resolvedSelector, container);
                    if (nextNesting) {
                        hasNesting = true;
                        const nextNestingParent = parentSelectors
                            ? this.getNestingParentSelectors(parentSelectors, nextNesting)
                            : null;
                        nextResolvedSelectors.push(...this.resolveSelectorForNestContaining(owner, resolvedSelector.selector, nextNesting, nextNestingParent, container));
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
    getNestingParentSelectors(parentSelectors, nesting) {
        if (nesting.node.value === "&") {
            return parentSelectors;
        }
        const partialRef = /^\^\[([\s\S]+?)\]$/u.exec(nesting.node.value);
        if (partialRef) {
            const partialRefValue = partialRef[1];
            const arrayParentSelectors = toArray(parentSelectors);
            const parsed = parsePartialRefValue(partialRefValue, arrayParentSelectors.length);
            if (!parsed) {
                return null;
            }
            if (parsed.start === 0) {
                return arrayParentSelectors[parsed.end];
            }
            return this.buildRangeResolveNestingSelectors(arrayParentSelectors.slice(parsed.start, parsed.end + 1));
        }
        if (nesting.node.value === "~/" && nesting.nestingIndex === 0) {
            const arrayParentSelectors = toArray(parentSelectors);
            return arrayParentSelectors[0];
        }
        if (/^(?:\.\.\/)+$/u.test(nesting.node.value) &&
            nesting.nestingIndex === 0) {
            const arrayParentSelectors = toArray(parentSelectors);
            const index = arrayParentSelectors.length - nesting.node.value.length / 3 - 1;
            return arrayParentSelectors.length > index && index >= 0
                ? arrayParentSelectors[index]
                : null;
        }
        if (nesting.node.value === "/" && nesting.nestingIndex === 0) {
            return null;
        }
        return parentSelectors;
    }
    buildRangeResolveNestingSelectors(range) {
        const stack = [...range];
        let resolvedSelectors = null;
        let next = stack.shift();
        while (next != null) {
            const targetResolvedSelectors = new css_selector_resolver_1.ResolvedSelectors(next.container, resolvedSelectors);
            for (const selector of next.container.selectors.filter(selectors_1.hasNodesSelector)) {
                const selectors = this.resolveNestingSelectors(targetResolvedSelectors, selector.nodes, resolvedSelectors, next.container);
                targetResolvedSelectors.selectors.push(...selectors);
            }
            resolvedSelectors = targetResolvedSelectors;
            next = stack.shift();
        }
        return resolvedSelectors;
    }
}
exports.StylusSelectorResolver = StylusSelectorResolver;
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
function parsePartialRefValue(partialRefValue, length) {
    function numberToIndex(n, minusOffset = 0) {
        if (n >= 0) {
            return n;
        }
        return length + n + minusOffset;
    }
    const num = Number(partialRefValue);
    if (Number.isInteger(num)) {
        const index = numberToIndex(num, -1);
        if (index < 0 || length <= index) {
            return null;
        }
        return {
            start: 0,
            end: index,
        };
    }
    const rangeValues = /^([+-]?\d+)\.\.([+-]?\d+)$/u.exec(partialRefValue);
    if (rangeValues) {
        const start = numberToIndex(Number(rangeValues[1]));
        const end = numberToIndex(Number(rangeValues[2]));
        if (start < 0 ||
            length <= start ||
            end < 0 ||
            length <= end ||
            end < start) {
            return null;
        }
        return {
            start,
            end,
        };
    }
    return null;
}
function toArray(selectors) {
    const array = [selectors];
    let parent = selectors.parent;
    while (parent != null) {
        array.unshift(parent);
        parent = parent.parent;
    }
    return array;
}

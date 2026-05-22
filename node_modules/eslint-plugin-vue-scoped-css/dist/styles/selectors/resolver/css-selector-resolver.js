"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSSSelectorResolver = exports.ResolvedSelector = exports.ResolvedSelectors = void 0;
const selectors_1 = require("../../utils/selectors");
const css_nodes_1 = require("../../utils/css-nodes");
class ResolvedSelectors {
    constructor(container, parent) {
        var _a;
        this.selectors = [];
        this.children = [];
        this.container = container;
        this.parent = parent;
        this.level = ((_a = parent === null || parent === void 0 ? void 0 : parent.level) !== null && _a !== void 0 ? _a : -1) + 1;
    }
}
exports.ResolvedSelectors = ResolvedSelectors;
class ResolvedSelector {
    constructor(owner, selector) {
        this.owner = owner;
        this.selector = selector;
    }
}
exports.ResolvedSelector = ResolvedSelector;
class CSSSelectorResolver {
    resolveSelectors(rootStyle) {
        return this.resolveNodesSelectors(rootStyle.nodes, null);
    }
    resolveNodesSelectors(nodes, parentSelector) {
        const results = [];
        for (const node of nodes) {
            if (this.isIgnoreNode(node)) {
                continue;
            }
            if ((0, css_nodes_1.hasSelectorNodes)(node)) {
                results.push(this.resolveNodeSelectors(node, parentSelector));
            }
            else {
                if ((0, css_nodes_1.isVCSSContainerNode)(node)) {
                    results.push(...this.resolveNodesSelectors(node.nodes, parentSelector));
                }
            }
        }
        return results;
    }
    resolveNodeSelectors(node, parentSelector) {
        const selectorNodes = node.selectors.filter(selectors_1.hasNodesSelector);
        const resolved = new ResolvedSelectors(node, parentSelector);
        if (!parentSelector) {
            resolved.selectors.push(...selectorNodes.map((selectorNode) => new ResolvedSelector(resolved, selectorNode.nodes)));
        }
        else {
            for (const selectorNode of selectorNodes.filter(selectors_1.hasNodesSelector)) {
                resolved.selectors.push(...this.resolveNestingSelectors(resolved, selectorNode.nodes, parentSelector, node));
            }
        }
        if ((0, css_nodes_1.isVCSSContainerNode)(node)) {
            resolved.children.push(...this.resolveNodesSelectors(node.nodes, resolved));
        }
        return resolved;
    }
    isIgnoreNode(node) {
        return ((0, css_nodes_1.isVCSSAtRule)(node) && node.name === "keyframes" && node.identifier === "@");
    }
    resolveNestingSelectors(owner, selectorNodes, parentSelectors, container) {
        if ((0, selectors_1.isNestingAtRule)(container)) {
            return this.resolveSelectorForNestContaining(owner, selectorNodes, (0, selectors_1.findNestingSelector)(selectorNodes), parentSelectors, container);
        }
        const nestingIndex = selectorNodes.findIndex(selectors_1.isNestingSelector);
        if (nestingIndex === 0) {
            return this.resolveSelectorForNestPrefixed(owner, selectorNodes, parentSelectors, container);
        }
        return [new ResolvedSelector(owner, selectorNodes)];
    }
    resolveSelectorForNestPrefixed(owner, selectorNodes, parentSelectors, container) {
        if (!selectorNodes.length || !(0, selectors_1.isNestingSelector)(selectorNodes[0])) {
            return [new ResolvedSelector(owner, selectorNodes)];
        }
        const after = selectorNodes.slice(1);
        return this.resolveSelectorForNestConcat(owner, after, parentSelectors, container);
    }
    resolveSelectorForNestConcat(owner, selectorNodes, parentSelectors, _container) {
        if (!parentSelectors) {
            const nodes = [...selectorNodes];
            if ((0, selectors_1.isDescendantCombinator)(nodes[0])) {
                nodes.shift();
            }
            if ((0, selectors_1.isDescendantCombinator)(nodes[nodes.length - 1])) {
                nodes.pop();
            }
            return [new ResolvedSelector(owner, [...nodes])];
        }
        return parentSelectors.selectors.map((parentSelector) => {
            const nodes = [...selectorNodes];
            const parent = [...parentSelector.selector];
            if (parent.length > 0 &&
                (0, selectors_1.isSelectorCombinator)(parent[parent.length - 1]) &&
                nodes.length > 0 &&
                (0, selectors_1.isSelectorCombinator)(nodes[0])) {
                if ((0, selectors_1.isDescendantCombinator)(nodes[0])) {
                    nodes.shift();
                }
                else if ((0, selectors_1.isDescendantCombinator)(parent[parent.length - 1])) {
                    parent.pop();
                }
            }
            return new ResolvedSelector(owner, [...parent, ...nodes]);
        });
    }
    resolveSelectorForNestContaining(owner, selectorNodes, nestingInfo, parentSelectors, _container) {
        if (!nestingInfo) {
            return [new ResolvedSelector(owner, selectorNodes)];
        }
        const { nestingIndex, nodes: hasNestingNodes, node: nestingNode, } = nestingInfo;
        const beforeSelector = hasNestingNodes.slice(0, nestingIndex);
        const afterSelector = hasNestingNodes.slice(nestingIndex + 1);
        const nestingLeftNode = beforeSelector.length > 0
            ? beforeSelector[beforeSelector.length - 1]
            : null;
        const nestingRightNode = afterSelector.length > 0 ? afterSelector[0] : null;
        const maybeJoinLeft = nestingLeftNode &&
            nestingLeftNode.range[1] === nestingNode.range[0] &&
            !(0, selectors_1.isSelectorCombinator)(nestingLeftNode);
        const maybeJoinRight = nestingRightNode &&
            nestingNode.range[1] === nestingRightNode.range[0] &&
            (0, selectors_1.isTypeSelector)(nestingRightNode);
        let resolved;
        if (parentSelectors) {
            resolved = parentSelectors.selectors.map((p) => {
                const before = [...beforeSelector];
                const after = [...afterSelector];
                const parentSelector = [...p.selector];
                const needJoinLeft = maybeJoinLeft && (0, selectors_1.isTypeSelector)(parentSelector[0]);
                const needJoinRight = maybeJoinRight &&
                    !(0, selectors_1.isSelectorCombinator)(parentSelector[parentSelector.length - 1]);
                if (needJoinLeft && needJoinRight && parentSelector.length === 1) {
                    before.push(newNestingConcatBothSelectorNodes(before.pop(), parentSelector.shift(), after.shift(), nestingNode));
                }
                else {
                    if (needJoinLeft) {
                        before.push(newNestingConcatLeftSelectorNodes(before.pop(), parentSelector.shift(), nestingNode));
                    }
                    if (needJoinRight) {
                        after.unshift(newNestingConcatRightSelectorNodes(parentSelector.pop(), after.shift(), nestingNode));
                    }
                }
                return new ResolvedSelector(owner, [
                    ...before,
                    ...parentSelector,
                    ...after,
                ]);
            });
        }
        else {
            const before = [...beforeSelector];
            const after = [...afterSelector];
            while ((0, selectors_1.isDescendantCombinator)(before[0])) {
                before.shift();
            }
            if ((0, selectors_1.isDescendantCombinator)(after[0])) {
                while ((0, selectors_1.isDescendantCombinator)(before[before.length - 1])) {
                    before.pop();
                }
            }
            while (before.length === 0 && (0, selectors_1.isDescendantCombinator)(after[0])) {
                after.shift();
            }
            while ((0, selectors_1.isDescendantCombinator)(after[after.length - 1])) {
                after.pop();
            }
            resolved = [new ResolvedSelector(owner, [...before, ...after])];
        }
        let nestingTargetNode = nestingNode;
        while (!selectorNodes.includes(nestingTargetNode)) {
            const parent = nestingTargetNode.parent;
            const index = parent.parent.nodes.indexOf(parent);
            const before = parent.parent.nodes.slice(0, index);
            const after = parent.parent.nodes.slice(index + 1);
            resolved = resolved.map((selector) => {
                const newNode = parent.copy();
                newNode.nodes = selector.selector;
                return new ResolvedSelector(owner, [...before, newNode, ...after]);
            });
            nestingTargetNode = parent;
        }
        return resolved;
    }
}
exports.CSSSelectorResolver = CSSSelectorResolver;
function newNestingConcatBothSelectorNodes(left, parent, right, _nesting) {
    const loc = {
        start: left.loc.start,
        end: right.loc.end,
    };
    const newNode = left.copy({
        loc,
        start: left.range[0],
        end: right.range[1],
        parent: left.parent,
        value: `${left.value}${parent.selector}${right.selector}`,
    });
    return newNode;
}
function newNestingConcatLeftSelectorNodes(left, parent, nesting) {
    const loc = {
        start: left.loc.start,
        end: nesting.loc.end,
    };
    const newNode = left.copy({
        loc,
        start: left.range[0],
        end: nesting.range[1],
        parent: left.parent,
        value: `${left.value}${parent.selector}`,
    });
    return newNode;
}
function newNestingConcatRightSelectorNodes(parent, right, nesting) {
    const loc = {
        start: nesting.loc.start,
        end: right.loc.end,
    };
    const newNode = parent.copy({
        node: right.node,
        loc,
        start: nesting.range[0],
        end: right.range[1],
        parent: right.parent,
        value: `${parent.value}${right.selector}`,
    });
    return newNode;
}

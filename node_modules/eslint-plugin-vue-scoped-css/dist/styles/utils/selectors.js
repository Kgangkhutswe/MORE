"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findNestingSelector = exports.findNestingSelectors = exports.isNestingAtRule = exports.isDeepCombinator = exports.isGeneralSiblingCombinator = exports.isAdjacentSiblingCombinator = exports.isChildCombinator = exports.isDescendantCombinator = exports.isSelectorCombinator = exports.isPseudo = exports.isNestingSelector = exports.isUniversalSelector = exports.isClassSelector = exports.isIDSelector = exports.isTypeSelector = exports.isPseudoEmptyArguments = exports.isVGlobalPseudo = exports.isVSlottedPseudo = exports.isVDeepPseudo = exports.isVDeepPseudoV2 = exports.isVueSpecialPseudo = exports.normalizePseudoParams = exports.hasNodesSelector = void 0;
const ast_1 = require("../ast");
const css_nodes_1 = require("./css-nodes");
function hasNodesSelector(node) {
    return (node != null &&
        (node.type === "VCSSSelector" || node.type === "VCSSSelectorPseudo"));
}
exports.hasNodesSelector = hasNodesSelector;
function normalizePseudoParams(pseudo, nodes) {
    const results = [];
    let buffer = [];
    for (const node of nodes) {
        if (node.type === "VCSSSelector") {
            if (buffer.length) {
                const startNode = buffer[0];
                const endNode = buffer[buffer.length - 1];
                const loc = {
                    start: startNode.loc.start,
                    end: endNode.loc.end,
                };
                results.push(new ast_1.VCSSSelector(buffer[0], loc, startNode.start, endNode.end, {
                    parent: pseudo,
                    nodes: buffer,
                }));
                buffer = [];
            }
            results.push(node);
        }
        else {
            buffer.push(node);
        }
    }
    if (buffer.length) {
        const startNode = buffer[0];
        const endNode = buffer[buffer.length - 1];
        const loc = {
            start: startNode.loc.start,
            end: endNode.loc.end,
        };
        results.push(new ast_1.VCSSSelector(buffer[0], loc, startNode.start, endNode.end, {
            parent: pseudo,
            nodes: buffer,
        }));
        buffer = [];
    }
    return results;
}
exports.normalizePseudoParams = normalizePseudoParams;
function isVueSpecialPseudo(node) {
    return isVDeepPseudo(node) || isVSlottedPseudo(node) || isVGlobalPseudo(node);
}
exports.isVueSpecialPseudo = isVueSpecialPseudo;
function isVDeepPseudoV2(node) {
    if (isVDeepPseudo(node)) {
        return node.nodes.length === 0;
    }
    return false;
}
exports.isVDeepPseudoV2 = isVDeepPseudoV2;
function isVDeepPseudo(node) {
    if (isPseudo(node)) {
        const val = node.value.trim();
        return val === "::v-deep" || val === ":deep";
    }
    return false;
}
exports.isVDeepPseudo = isVDeepPseudo;
function isVSlottedPseudo(node) {
    if (isPseudo(node)) {
        const val = node.value.trim();
        return val === "::v-slotted" || val === ":slotted";
    }
    return false;
}
exports.isVSlottedPseudo = isVSlottedPseudo;
function isVGlobalPseudo(node) {
    if (isPseudo(node)) {
        const val = node.value.trim();
        return val === "::v-global" || val === ":global";
    }
    return false;
}
exports.isVGlobalPseudo = isVGlobalPseudo;
function isPseudoEmptyArguments(node) {
    return (node.nodes.length === 0 ||
        (node.nodes.length === 1 && node.nodes[0].nodes.length === 0));
}
exports.isPseudoEmptyArguments = isPseudoEmptyArguments;
function isTypeSelector(node) {
    return (node === null || node === void 0 ? void 0 : node.type) === "VCSSTypeSelector";
}
exports.isTypeSelector = isTypeSelector;
function isIDSelector(node) {
    return (node === null || node === void 0 ? void 0 : node.type) === "VCSSIDSelector";
}
exports.isIDSelector = isIDSelector;
function isClassSelector(node) {
    return (node === null || node === void 0 ? void 0 : node.type) === "VCSSClassSelector";
}
exports.isClassSelector = isClassSelector;
function isUniversalSelector(node) {
    return (node === null || node === void 0 ? void 0 : node.type) === "VCSSUniversalSelector";
}
exports.isUniversalSelector = isUniversalSelector;
function isNestingSelector(node) {
    return (node === null || node === void 0 ? void 0 : node.type) === "VCSSNestingSelector";
}
exports.isNestingSelector = isNestingSelector;
function isPseudo(node) {
    return (node === null || node === void 0 ? void 0 : node.type) === "VCSSSelectorPseudo";
}
exports.isPseudo = isPseudo;
function isSelectorCombinator(node) {
    return (node === null || node === void 0 ? void 0 : node.type) === "VCSSSelectorCombinator";
}
exports.isSelectorCombinator = isSelectorCombinator;
function isDescendantCombinator(node) {
    return isSelectorCombinator(node) && node.value.trim() === "";
}
exports.isDescendantCombinator = isDescendantCombinator;
function isChildCombinator(node) {
    return isSelectorCombinator(node) && node.value.trim() === ">";
}
exports.isChildCombinator = isChildCombinator;
function isAdjacentSiblingCombinator(node) {
    return isSelectorCombinator(node) && node.value.trim() === "+";
}
exports.isAdjacentSiblingCombinator = isAdjacentSiblingCombinator;
function isGeneralSiblingCombinator(node) {
    return isSelectorCombinator(node) && node.value.trim() === "~";
}
exports.isGeneralSiblingCombinator = isGeneralSiblingCombinator;
function isDeepCombinator(node) {
    if (isSelectorCombinator(node)) {
        const val = node.value.trim();
        return val === ">>>" || val === "/deep/";
    }
    return false;
}
exports.isDeepCombinator = isDeepCombinator;
function isNestingAtRule(node) {
    if (node == null) {
        return false;
    }
    return (0, css_nodes_1.isVCSSAtRule)(node) && node.name === "nest" && node.identifier === "@";
}
exports.isNestingAtRule = isNestingAtRule;
function* findNestingSelectors(nodes) {
    for (const node of nodes) {
        if (isNestingSelector(node)) {
            yield {
                nestingIndex: nodes.indexOf(node),
                node,
                nodes,
            };
        }
        if (hasNodesSelector(node)) {
            yield* findNestingSelectors(node.nodes);
        }
    }
}
exports.findNestingSelectors = findNestingSelectors;
function findNestingSelector(nodes) {
    for (const nest of findNestingSelectors(nodes)) {
        return nest;
    }
    return null;
}
exports.findNestingSelector = findNestingSelector;

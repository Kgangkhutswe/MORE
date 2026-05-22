"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasSelectorNodes = exports.isVCSSContainerNode = exports.isVCSSComment = exports.isVCSSDeclarationProperty = exports.isVCSSStyleSheet = exports.isVCSSStyleRule = exports.isVCSSAtRule = void 0;
const selectors_1 = require("./selectors");
function isVCSSAtRule(node) {
    return (node === null || node === void 0 ? void 0 : node.type) === "VCSSAtRule";
}
exports.isVCSSAtRule = isVCSSAtRule;
function isVCSSStyleRule(node) {
    return (node === null || node === void 0 ? void 0 : node.type) === "VCSSStyleRule";
}
exports.isVCSSStyleRule = isVCSSStyleRule;
function isVCSSStyleSheet(node) {
    return (node === null || node === void 0 ? void 0 : node.type) === "VCSSStyleSheet";
}
exports.isVCSSStyleSheet = isVCSSStyleSheet;
function isVCSSDeclarationProperty(node) {
    return (node === null || node === void 0 ? void 0 : node.type) === "VCSSDeclarationProperty";
}
exports.isVCSSDeclarationProperty = isVCSSDeclarationProperty;
function isVCSSComment(node) {
    return (node === null || node === void 0 ? void 0 : node.type) === "VCSSComment" || (node === null || node === void 0 ? void 0 : node.type) === "VCSSInlineComment";
}
exports.isVCSSComment = isVCSSComment;
function isVCSSContainerNode(node) {
    return (isVCSSAtRule(node) ||
        isVCSSStyleRule(node) ||
        isVCSSStyleSheet(node) ||
        (node === null || node === void 0 ? void 0 : node.type) === "VCSSUnknown");
}
exports.isVCSSContainerNode = isVCSSContainerNode;
function hasSelectorNodes(node) {
    if (isVCSSStyleRule(node) || (0, selectors_1.isNestingAtRule)(node)) {
        return true;
    }
    return false;
}
exports.hasSelectorNodes = hasSelectorNodes;

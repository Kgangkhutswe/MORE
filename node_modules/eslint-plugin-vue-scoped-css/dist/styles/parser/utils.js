"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPostCSSSPContainer = exports.isPostCSSContainer = void 0;
function isPostCSSContainer(node) {
    return node.nodes != null;
}
exports.isPostCSSContainer = isPostCSSContainer;
function isPostCSSSPContainer(node) {
    return node.nodes != null;
}
exports.isPostCSSSPContainer = isPostCSSSPContainer;

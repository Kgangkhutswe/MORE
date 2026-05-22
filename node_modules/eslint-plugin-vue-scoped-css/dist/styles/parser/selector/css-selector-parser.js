"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSSSelectorParser = void 0;
const postcss_selector_parser_1 = __importDefault(require("postcss-selector-parser"));
const ast_1 = require("../../ast");
const selectors_1 = require("../../utils/selectors");
const utils_1 = require("../utils");
const utils_2 = require("../../../utils/utils");
class CSSSelectorParser {
    constructor(sourceCode, commentContainer) {
        this.lang = "css";
        this.sourceCode = sourceCode;
        this.commentContainer = commentContainer;
    }
    parse(rawSelector, offsetLocation, parent) {
        const selectorParserRoot = this.parseInternal(rawSelector);
        return this._postcssSelectorParserNodeChiildrenToASTNodes(offsetLocation, selectorParserRoot, parent);
    }
    parseInternal(selector) {
        return (0, postcss_selector_parser_1.default)().astSync(selector);
    }
    parseCommentsInternal(selector) {
        return (0, postcss_selector_parser_1.default)().astSync(selector);
    }
    _postcssSelectorParserNodeChiildrenToASTNodes(offsetLocation, node, parent) {
        const astNodes = removeInvalidDescendantCombinator(node.nodes
            .map((child) => this._postcssSelectorParserNodeToASTNode(offsetLocation, child, parent))
            .filter(utils_2.isDefined));
        if (astNodes.length !== node.nodes.length) {
            if (node.type === "selector") {
                const firstAstNode = astNodes[0];
                parent.loc.start = Object.assign({}, firstAstNode.loc.start);
                parent.start = firstAstNode.start;
                parent.range = [firstAstNode.start, parent.range[1]];
            }
            if (node.type === "selector") {
                const lastAstNode = astNodes[astNodes.length - 1];
                parent.loc.end = Object.assign({}, lastAstNode.loc.end);
                parent.end = lastAstNode.end;
                parent.range = [parent.range[0], lastAstNode.end];
            }
        }
        return astNodes;
    }
    _postcssSelectorParserNodeToASTNode(offsetLocation, node, parent) {
        const { sourceCode } = this;
        const loc = {
            start: getESLintLineAndColumnFromPostCSSSelectorParserNode(offsetLocation, node, "start"),
            end: getESLintLineAndColumnFromPostCSSSelectorParserNode(offsetLocation, node, "end"),
        };
        const start = sourceCode.getIndexFromLoc(loc.start);
        const end = sourceCode.getIndexFromLoc(loc.end);
        const astNode = this[typeToConvertMethodName(node.type)](node, loc, start, end, parent);
        if (astNode == null) {
            return null;
        }
        this.parseRawsSpaces(astNode, node, parent);
        if ((0, utils_1.isPostCSSSPContainer)(node)) {
            if (astNode.type === "VCSSSelectorPseudo") {
                astNode.nodes = (0, selectors_1.normalizePseudoParams)(astNode, this._postcssSelectorParserNodeChiildrenToASTNodes(offsetLocation, node, astNode));
            }
            else if (astNode.type === "VCSSSelector") {
                astNode.nodes = this._postcssSelectorParserNodeChiildrenToASTNodes(offsetLocation, node, astNode);
            }
        }
        return astNode;
    }
    parseRawsSpaces(astNode, node, parent) {
        if (!hasRaws(node) || !node.raws.spaces) {
            return;
        }
        const { after, before } = node.raws.spaces;
        if (after === null || after === void 0 ? void 0 : after.trim()) {
            const selectorParserRoot = this.parseCommentsInternal(after);
            selectorParserRoot.walkComments((comment) => {
                this._postcssSelectorParserNodeToASTNode(astNode.loc.end, comment, parent);
            });
        }
        if (before === null || before === void 0 ? void 0 : before.trim()) {
            const startLoc = this.sourceCode.getLocFromIndex(astNode.range[0] - before.length);
            const selectorParserRoot = this.parseCommentsInternal(before);
            selectorParserRoot.walkComments((comment) => {
                this._postcssSelectorParserNodeToASTNode(startLoc, comment, parent);
            });
        }
    }
    convertSelectorNode(node, loc, start, end, parent) {
        let source = this.sourceCode.text.slice(start, end);
        const beforeSpaces = /^\s+/u.exec(source);
        if (beforeSpaces === null || beforeSpaces === void 0 ? void 0 : beforeSpaces[0]) {
            start = start + beforeSpaces[0].length;
            loc.start = this.sourceCode.getLocFromIndex(start);
            source = source.slice(beforeSpaces[0].length);
        }
        const afterSpaces = /\s+$/u.exec(source);
        if (afterSpaces === null || afterSpaces === void 0 ? void 0 : afterSpaces[0]) {
            end = end - afterSpaces[0].length;
            loc.end = this.sourceCode.getLocFromIndex(end);
            source = source.slice(0, -afterSpaces[0].length);
        }
        const beforeTrivials = /^\(\s*/u.exec(source);
        const afterTrivials = /\s*\)$/u.exec(source);
        if ((beforeTrivials === null || beforeTrivials === void 0 ? void 0 : beforeTrivials[0]) && (afterTrivials === null || afterTrivials === void 0 ? void 0 : afterTrivials[0])) {
            start = start + beforeTrivials[0].length;
            loc.start = this.sourceCode.getLocFromIndex(start);
            end = end - afterTrivials[0].length;
            loc.end = this.sourceCode.getLocFromIndex(end);
            source = source.slice(beforeTrivials[0].length, -afterTrivials[0].length);
        }
        return new ast_1.VCSSSelector(node, loc, start, end, {
            parent: parent,
        });
    }
    convertTagNode(node, loc, start, end, parent) {
        return new ast_1.VCSSTypeSelector(node, loc, start, end, {
            parent,
        });
    }
    convertIdNode(node, loc, start, end, parent) {
        return new ast_1.VCSSIDSelector(node, loc, start, end, {
            parent,
        });
    }
    convertClassNode(node, loc, start, end, parent) {
        return new ast_1.VCSSClassSelector(node, loc, start, end, {
            parent,
        });
    }
    convertNestingNode(node, loc, start, end, parent) {
        return new ast_1.VCSSNestingSelector(node, loc, start, end, {
            parent,
        });
    }
    convertUniversalNode(node, loc, start, end, parent) {
        return new ast_1.VCSSUniversalSelector(node, loc, start, end, {
            parent,
        });
    }
    convertAttributeNode(node, loc, start, end, parent) {
        return new ast_1.VCSSAttributeSelector(node, loc, start, end, {
            parent,
        });
    }
    convertPseudoNode(node, loc, start, end, parent) {
        return new ast_1.VCSSSelectorPseudo(node, loc, start, end, {
            parent,
        });
    }
    convertCombinatorNode(node, loc, start, end, parent) {
        const astNode = new ast_1.VCSSSelectorCombinator(node, loc, start, end, {
            parent,
        });
        adjustEndLocation(astNode, start + astNode.value.length, this.sourceCode);
        return astNode;
    }
    convertStringNode(node, loc, start, end, parent) {
        const astNode = new ast_1.VCSSUnknownSelector(node, loc, start, end, {
            parent,
        });
        adjustEndLocation(astNode, start + astNode.value.length, this.sourceCode);
        return astNode;
    }
    convertCommentNode(node, loc, start, end, parent) {
        const text = node.value.replace(/^\s*\/\*/u, "").replace(/\*\/\s*$/u, "");
        this.commentContainer.push(new ast_1.VCSSComment(node, text, loc, start, end, {
            parent,
        }));
        return null;
    }
    convertUnknownTypeNode(node, loc, start, end, parent) {
        return new ast_1.VCSSUnknownSelector(node, loc, start, end, {
            parent,
        });
    }
}
exports.CSSSelectorParser = CSSSelectorParser;
function getESLintLineAndColumnFromPostCSSSelectorParserNode(offsetLocation, node, locName) {
    const sourceLoc = (node.source && node.source[locName]) || {
        line: 0,
        column: 1,
    };
    let { line } = sourceLoc;
    let column = sourceLoc.column - 1;
    if (line === 1) {
        line = offsetLocation.line;
        column = offsetLocation.column + column;
    }
    else {
        line = offsetLocation.line + line - 1;
    }
    if (locName === "end") {
        column++;
    }
    return { line, column };
}
function adjustEndLocation(astNode, endIndex, sourceCode) {
    if (astNode.range[1] === endIndex) {
        return;
    }
    astNode.range[1] = endIndex;
    astNode.end = endIndex;
    astNode.loc.end = sourceCode.getLocFromIndex(endIndex);
    let p = astNode.parent;
    while (p && p.end < endIndex) {
        p.end = endIndex;
        p.range[1] = endIndex;
        p.loc.end = Object.assign({}, astNode.loc.end);
        p = p.parent;
    }
}
function removeInvalidDescendantCombinator(nodes) {
    const results = [];
    let prev = null;
    for (let index = 0; index < nodes.length; index++) {
        const node = nodes[index];
        if ((0, selectors_1.isDescendantCombinator)(node)) {
            if (results.length === 0) {
                continue;
            }
            if ((0, selectors_1.isSelectorCombinator)(prev) || (0, selectors_1.isVDeepPseudoV2)(prev)) {
                continue;
            }
            const next = nodes[index + 1];
            if ((0, selectors_1.isSelectorCombinator)(next)) {
                continue;
            }
        }
        else if ((0, selectors_1.isVueSpecialPseudo)(node)) {
            if (prev && !(0, selectors_1.isSelectorCombinator)(prev)) {
                results.push(new ast_1.VCSSSelectorCombinator(node.node, node.loc, node.start, node.end, { parent: node.parent, value: " " }));
            }
        }
        results.push(node);
        prev = node;
    }
    return results;
}
const convertNodeTypes = {
    tag: "convertTagNode",
    string: "convertStringNode",
    selector: "convertSelectorNode",
    pseudo: "convertPseudoNode",
    nesting: "convertNestingNode",
    id: "convertIdNode",
    comment: "convertCommentNode",
    combinator: "convertCombinatorNode",
    class: "convertClassNode",
    attribute: "convertAttributeNode",
    universal: "convertUniversalNode",
};
function typeToConvertMethodName(type) {
    if (type === "root") {
        return "convertUnknownTypeNode";
    }
    return convertNodeTypes[type] || "convertUnknownTypeNode";
}
function hasRaws(node) {
    return node.raws != null;
}

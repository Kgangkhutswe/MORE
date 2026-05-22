"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StylusSelectorParser = void 0;
const css_selector_parser_1 = require("./css-selector-parser");
const postcss_selector_parser_1 = __importDefault(require("postcss-selector-parser"));
const ast_1 = require("../../ast");
const replace_utils_1 = require("./replace-utils");
function replaceStylusNesting(_result, random) {
    return `[${random}]`;
}
function restoreStylusNesting(attribute, random, original) {
    if (attribute.type !== "attribute") {
        return null;
    }
    if (!attribute.attribute.includes(random)) {
        return null;
    }
    const node = postcss_selector_parser_1.default.nesting(Object.assign({}, attribute));
    node.value = original;
    return node;
}
class StylusSelectorParser extends css_selector_parser_1.CSSSelectorParser {
    parseInternal(selector) {
        const replaceSelectorContext = (0, replace_utils_1.replaceSelector)(selector, [
            {
                regexp: /\{[\s\S]+?\}/gu,
                replace: (_res, random) => `_${random}_`,
            },
            {
                regexp: /\^\[[\s\S]+?\]/gu,
                replace: replaceStylusNesting,
                restore: restoreStylusNesting,
            },
            {
                regexp: /~\//gu,
                replace: replaceStylusNesting,
                restore: restoreStylusNesting,
            },
            {
                regexp: /(?:\.\.\/)+/gu,
                replace: replaceStylusNesting,
                restore: restoreStylusNesting,
            },
            {
                regexp: /\//gu,
                replace: replaceStylusNesting,
                restore: restoreStylusNesting,
            },
        ], [
            {
                regexp: /\/\/[^\n\r\u2028\u2029]*/gu,
                replace: (_res, random) => `/*${random}*/`,
            },
        ], [
            {
                regexp: /([\n\r\u2028\u2029])(\s*)/gu,
                replace(res, _random, { beforeCss }) {
                    const before = [...beforeCss];
                    let prev = before.pop();
                    while (prev != null && (prev.startsWith("/*") || !prev.trim())) {
                        prev = before.pop();
                    }
                    if (prev === null || prev === void 0 ? void 0 : prev.trim().endsWith(",")) {
                        return res[0];
                    }
                    let after = selector.slice(res.index);
                    let next;
                    while ((next = after
                        .replace(/^\s*\/\/[^\n\r\u2028\u2029]*\s*/gu, "")
                        .replace(/^\s*\/\*[\s\S]+?\*\/\s*/gu, "")
                        .trim()) &&
                        next !== after) {
                        after = next;
                    }
                    if (after.startsWith(",")) {
                        return res[0];
                    }
                    return `${res[1]},${res[2]}`;
                },
            },
        ]);
        const result = (0, postcss_selector_parser_1.default)().astSync(replaceSelectorContext.cssSelector);
        if (!replaceSelectorContext.hasReplace()) {
            return result;
        }
        return (0, replace_utils_1.restoreReplacedSelector)(result, replaceSelectorContext);
    }
    parseCommentsInternal(selector) {
        return this.parseInternal(selector);
    }
    convertCommentNode(node, loc, start, end, parent) {
        if (node.value.startsWith("//")) {
            const text = node.value.replace(/^\s*\/\//u, "");
            this.commentContainer.push(new ast_1.VCSSInlineComment(node, text, loc, start, end, {
                parent,
            }));
            return null;
        }
        return super.convertCommentNode(node, loc, start, end, parent);
    }
}
exports.StylusSelectorParser = StylusSelectorParser;

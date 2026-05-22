"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCSSSelectorParser = void 0;
const css_selector_parser_1 = require("./css-selector-parser");
const postcss_selector_parser_1 = __importDefault(require("postcss-selector-parser"));
const ast_1 = require("../../ast");
const replace_utils_1 = require("./replace-utils");
class SCSSSelectorParser extends css_selector_parser_1.CSSSelectorParser {
    parseInternal(selector) {
        const replaceSelectorContext = (0, replace_utils_1.replaceSelector)(selector, [
            {
                regexp: /#\{[\s\S]+?\}/gu,
                replace: (_res, random) => `_${random}_`,
            },
        ], [
            {
                regexp: /\/\/[^\n\r\u2028\u2029]*/gu,
                replace: (_res, random) => `/*${random}*/`,
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
exports.SCSSSelectorParser = SCSSSelectorParser;

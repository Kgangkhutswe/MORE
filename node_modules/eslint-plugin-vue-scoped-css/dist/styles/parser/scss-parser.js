"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCSSParser = void 0;
const postcss_scss_1 = __importDefault(require("postcss-scss"));
const css_parser_1 = require("./css-parser");
const ast_1 = require("../ast");
const scss_selector_parser_1 = require("./selector/scss-selector-parser");
class SCSSParser extends css_parser_1.CSSParser {
    parseInternal(css) {
        return postcss_scss_1.default.parse(css);
    }
    createSelectorParser() {
        return new scss_selector_parser_1.SCSSSelectorParser(this.sourceCode, this.commentContainer);
    }
    convertCommentNode(node, loc, start, end, parent) {
        var _a;
        if ((_a = node.raws) === null || _a === void 0 ? void 0 : _a.inline) {
            this.commentContainer.push(new ast_1.VCSSInlineComment(node, node.text, loc, start, end, {
                parent,
            }));
            return null;
        }
        return super.convertCommentNode(node, loc, start, end, parent);
    }
    getRaw(node, keyName) {
        const raw = super.getRaw(node, keyName);
        if (raw != null) {
            const scss = raw.scss;
            if (scss != null) {
                return {
                    raw: scss,
                    value: raw.value,
                };
            }
        }
        return raw;
    }
}
exports.SCSSParser = SCSSParser;

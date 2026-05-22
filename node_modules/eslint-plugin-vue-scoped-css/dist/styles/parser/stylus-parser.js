"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StylusParser = void 0;
const postcss_styl_1 = __importDefault(require("postcss-styl"));
const css_parser_1 = require("./css-parser");
const ast_1 = require("../ast");
const stylus_selector_parser_1 = require("./selector/stylus-selector-parser");
class StylusParser extends css_parser_1.CSSParser {
    parseInternal(css) {
        return postcss_styl_1.default.parse(css);
    }
    createSelectorParser() {
        return new stylus_selector_parser_1.StylusSelectorParser(this.sourceCode, this.commentContainer);
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
        if (keyName === "between" || keyName === "before" || keyName === "after") {
            const stylus = super.getRaw(node, `stylus${keyName[0].toUpperCase()}${keyName.slice(1)}`);
            if (stylus) {
                return stylus;
            }
        }
        const raw = super.getRaw(node, keyName);
        if (raw != null) {
            const stylus = raw.stylus;
            if (stylus != null) {
                return {
                    raw: stylus,
                    value: raw.value,
                };
            }
        }
        return raw;
    }
}
exports.StylusParser = StylusParser;

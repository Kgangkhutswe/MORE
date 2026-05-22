"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = void 0;
const css_parser_1 = require("./css-parser");
const scss_parser_1 = require("./scss-parser");
const stylus_parser_1 = require("./stylus-parser");
const utils_1 = require("../utils");
const PARSERS = {
    scss: scss_parser_1.SCSSParser,
    css: css_parser_1.CSSParser,
    stylus: stylus_parser_1.StylusParser,
};
function parse(sourceCode, offsetLocation, css, lang) {
    const Parser = (0, utils_1.isSupportedStyleLang)(lang) ? PARSERS[lang] : css_parser_1.CSSParser;
    const parser = new Parser(sourceCode, lang);
    return parser.parse(css, offsetLocation);
}
exports.parse = parse;

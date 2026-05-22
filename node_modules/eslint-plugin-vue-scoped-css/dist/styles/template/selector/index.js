"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const css_1 = __importDefault(require("./css"));
const scss_1 = __importDefault(require("./scss"));
const stylus_1 = __importDefault(require("./stylus"));
const utils_1 = require("../../utils");
const BUILDERS = {
    css: css_1.default,
    scss: scss_1.default,
    stylus: stylus_1.default,
};
function getSelectorTemplateElements(node) {
    const templateBuilder = (0, utils_1.isSupportedStyleLang)(node.lang)
        ? BUILDERS[node.lang]
        : css_1.default;
    return templateBuilder(node);
}
exports.default = getSelectorTemplateElements;

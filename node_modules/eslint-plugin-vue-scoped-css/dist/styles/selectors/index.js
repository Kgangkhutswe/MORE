"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResolvedSelector = exports.getResolvedSelectors = void 0;
const css_selector_resolver_1 = require("./resolver/css-selector-resolver");
Object.defineProperty(exports, "ResolvedSelector", { enumerable: true, get: function () { return css_selector_resolver_1.ResolvedSelector; } });
const scss_selector_resolver_1 = require("./resolver/scss-selector-resolver");
const stylus_selector_resolver_1 = require("./resolver/stylus-selector-resolver");
const utils_1 = require("../utils");
const RESOLVERS = {
    scss: scss_selector_resolver_1.SCSSSelectorResolver,
    css: css_selector_resolver_1.CSSSelectorResolver,
    stylus: stylus_selector_resolver_1.StylusSelectorResolver,
};
function getResolvedSelectors(style) {
    const lang = style.lang;
    const Resolver = (0, utils_1.isSupportedStyleLang)(lang)
        ? RESOLVERS[lang]
        : css_selector_resolver_1.CSSSelectorResolver;
    return extractSelectors(new Resolver().resolveSelectors(style.cssNode));
}
exports.getResolvedSelectors = getResolvedSelectors;
function extractSelectors(resolvedSelectorsList) {
    const result = [];
    for (const resolvedSelectors of resolvedSelectorsList) {
        result.push(...resolvedSelectors.selectors);
        result.push(...extractSelectors(resolvedSelectors.children));
    }
    return result;
}

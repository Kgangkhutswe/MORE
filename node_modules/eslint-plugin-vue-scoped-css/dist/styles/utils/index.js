"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeRegExp = exports.isSupportedStyleLang = void 0;
function isSupportedStyleLang(lang) {
    return lang === "css" || lang === "scss" || lang === "stylus";
}
exports.isSupportedStyleLang = isSupportedStyleLang;
function escapeRegExp(value) {
    return value.replace(/[$(-+.?[-^{-}]/gu, "\\$&");
}
exports.escapeRegExp = escapeRegExp;

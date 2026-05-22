"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toRegExp = void 0;
const RE_REGEXP_STR = /^\/(.+)\/([A-Za-z]*)$/u;
function toRegExp(string, flags) {
    const parts = RE_REGEXP_STR.exec(string);
    if (parts) {
        let flagArgs;
        if (flags) {
            flagArgs = [...new Set(parts[2] + flags)].join("");
        }
        else {
            flagArgs = parts[2];
        }
        return new RegExp(parts[1], flagArgs);
    }
    return new RegExp(string, flags);
}
exports.toRegExp = toRegExp;

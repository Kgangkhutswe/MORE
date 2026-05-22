"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseQueryOptions = void 0;
const regexp_1 = require("./utils/regexp");
function parseQueryOptions(options) {
    var _a;
    const { ignoreBEMModifier, captureClassesFromDoc } = options || {};
    return {
        ignoreBEMModifier: ignoreBEMModifier !== null && ignoreBEMModifier !== void 0 ? ignoreBEMModifier : false,
        captureClassesFromDoc: (_a = captureClassesFromDoc === null || captureClassesFromDoc === void 0 ? void 0 : captureClassesFromDoc.map((s) => (0, regexp_1.toRegExp)(s, "g"))) !== null && _a !== void 0 ? _a : [],
    };
}
exports.parseQueryOptions = parseQueryOptions;

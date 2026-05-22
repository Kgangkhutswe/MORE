"use strict";
const rules_1 = require("./utils/rules");
const configs = {
    base: require("./configs/base"),
    recommended: require("./configs/recommended"),
    "vue3-recommended": require("./configs/vue3-recommended"),
    all: require("./configs/all"),
};
const rules = rules_1.rules.reduce((obj, r) => {
    var _a;
    obj[((_a = r.meta.docs) === null || _a === void 0 ? void 0 : _a.ruleName) || ""] = r;
    return obj;
}, {});
module.exports = {
    configs,
    rules,
};

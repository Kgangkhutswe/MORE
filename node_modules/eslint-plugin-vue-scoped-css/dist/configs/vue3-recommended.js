"use strict";
const rules_1 = require("../utils/rules");
module.exports = {
    extends: require.resolve("./base"),
    rules: (0, rules_1.collectRules)("vue3-recommended"),
};

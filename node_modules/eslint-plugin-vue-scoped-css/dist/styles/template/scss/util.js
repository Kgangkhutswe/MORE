"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processValue = exports.processText = void 0;
const interpolation_1 = require("../interpolation");
function processText(text) {
    const elements = [];
    const value = text;
    let start = 0;
    const reg = /#\{[\s\S]*?\}/gu;
    let re = null;
    while ((re = reg.exec(value))) {
        elements.push(value.slice(start, re.index));
        elements.push(new interpolation_1.Interpolation(value.slice(re.index, reg.lastIndex)));
        start = reg.lastIndex;
    }
    elements.push(value.slice(start));
    return elements;
}
exports.processText = processText;
function processValue(text) {
    const elements = [];
    const value = text;
    let start = 0;
    const reg = /#\{[\s\S]*?\}|\$[\w-]+/gu;
    let re = null;
    while ((re = reg.exec(value))) {
        elements.push(value.slice(start, re.index));
        elements.push(new interpolation_1.Interpolation(value.slice(re.index, reg.lastIndex)));
        start = reg.lastIndex;
    }
    elements.push(value.slice(start));
    return elements;
}
exports.processValue = processValue;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParentElement = exports.isElementWrappedInTransition = exports.getWrapperTransition = exports.isSlotElement = exports.isSkipElement = exports.isRootElement = void 0;
const templates_1 = require("../../../utils/templates");
function isRootElement(element) {
    return element.type === "VElement" && isRootTemplate(element.parent);
}
exports.isRootElement = isRootElement;
function isRootTemplate(element) {
    return (element.type === "VElement" &&
        element.name === "template" &&
        element.parent.type === "VDocumentFragment");
}
function isSkipElement(element) {
    return (element.type === "VElement" &&
        (element.name === "template" || (0, templates_1.isTransitionElement)(element)));
}
exports.isSkipElement = isSkipElement;
function isSlotElement(element) {
    return element.type === "VElement" && element.name === "slot";
}
exports.isSlotElement = isSlotElement;
function getWrapperTransition(element) {
    let parent = element.parent;
    while (parent.type === "VElement") {
        if ((0, templates_1.isTransitionElement)(parent) || (0, templates_1.isTransitionGroupElement)(parent)) {
            return parent;
        }
        if (!isSlotElement(parent) && !isSkipElement(parent)) {
            return null;
        }
        parent = parent.parent;
    }
    return null;
}
exports.getWrapperTransition = getWrapperTransition;
function isElementWrappedInTransition(element) {
    return Boolean(getWrapperTransition(element));
}
exports.isElementWrappedInTransition = isElementWrappedInTransition;
function getParentElement(element) {
    if (isRootElement(element)) {
        return null;
    }
    let parent = element.parent;
    while (parent && (isSkipElement(parent) || isSlotElement(parent))) {
        if (isRootElement(parent)) {
            return null;
        }
        parent = parent.parent;
    }
    return (parent === null || parent === void 0 ? void 0 : parent.type) === "VElement" ? parent : null;
}
exports.getParentElement = getParentElement;

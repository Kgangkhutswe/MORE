"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VCSSInlineComment = exports.VCSSComment = exports.VCSSUnknownSelector = exports.VCSSSelectorCombinator = exports.VCSSSelectorPseudo = exports.VCSSAttributeSelector = exports.VCSSUniversalSelector = exports.VCSSNestingSelector = exports.VCSSClassSelector = exports.VCSSIDSelector = exports.VCSSTypeSelector = exports.VCSSSelector = exports.VCSSUnknown = exports.VCSSAtRule = exports.VCSSDeclarationProperty = exports.VCSSStyleRule = exports.VCSSStyleSheet = exports.VCSSParsingError = void 0;
class Node {
    constructor(node, type, loc, start, end, lang) {
        this.type = type;
        this.loc = loc;
        this.start = start;
        this.end = end;
        this.range = [start, end];
        this.node = node;
        this.lang = lang;
    }
}
class HasParentNode extends Node {
    constructor(node, type, loc, start, end, props) {
        super(node, type, loc, start, end, props.parent.lang);
        this.parent = props.parent;
    }
}
class VCSSParsingError extends Node {
    constructor(node, loc, start, end, props) {
        super(node, "VCSSParsingError", loc, start, end, props.lang);
        this.message = props.message;
    }
}
exports.VCSSParsingError = VCSSParsingError;
class VCSSStyleSheet extends Node {
    constructor(node, loc, start, end, props) {
        var _a, _b, _c;
        super(node, "VCSSStyleSheet", loc, start, end, props.lang);
        this.nodes = (_a = props.nodes) !== null && _a !== void 0 ? _a : [];
        this.comments = (_b = props.comments) !== null && _b !== void 0 ? _b : [];
        this.errors = (_c = props.errors) !== null && _c !== void 0 ? _c : [];
    }
    copy(props) {
        return copyStdNode(this, props);
    }
}
exports.VCSSStyleSheet = VCSSStyleSheet;
class VCSSStyleRule extends HasParentNode {
    constructor(node, loc, start, end, props) {
        var _a, _b, _c;
        super(node, "VCSSStyleRule", loc, start, end, props);
        this.selectorText = (_a = props.selectorText) !== null && _a !== void 0 ? _a : node.selector;
        if (props.rawSelectorText != null) {
            this.rawSelectorText = props.rawSelectorText;
        }
        else {
            const raws = node.raws;
            this.rawSelectorText = raws.selector ? raws.selector.raw : node.selector;
        }
        this.selectors = (_b = props.selectors) !== null && _b !== void 0 ? _b : [];
        this.nodes = (_c = props.nodes) !== null && _c !== void 0 ? _c : [];
    }
    copy(props) {
        return copyStdNode(this, props);
    }
}
exports.VCSSStyleRule = VCSSStyleRule;
class VCSSDeclarationProperty extends HasParentNode {
    constructor(node, loc, start, end, props) {
        var _a, _b;
        super(node, "VCSSDeclarationProperty", loc, start, end, props);
        this.property = (_a = props.property) !== null && _a !== void 0 ? _a : node.prop;
        this.value = getProp(props, node, "value");
        this.important = (_b = props.important) !== null && _b !== void 0 ? _b : Boolean(node.important);
    }
    copy(props) {
        return copyStdNode(this, props);
    }
}
exports.VCSSDeclarationProperty = VCSSDeclarationProperty;
class VCSSAtRule extends HasParentNode {
    constructor(node, loc, start, end, props) {
        var _a, _b, _c, _d, _e;
        super(node, "VCSSAtRule", loc, start, end, props);
        this.node = node;
        this.name = getProp(props, node, "name");
        this.identifier = props.identifier;
        this.paramsText = (_a = props.paramsText) !== null && _a !== void 0 ? _a : node.params;
        if (props.rawParamsText != null) {
            this.rawParamsText = props.rawParamsText;
        }
        else {
            const raws = node.raws;
            this.rawParamsText = (_c = (_b = raws.params) === null || _b === void 0 ? void 0 : _b.raw) !== null && _c !== void 0 ? _c : node.params;
        }
        this.selectors = (_d = props.selectors) !== null && _d !== void 0 ? _d : undefined;
        this.nodes = (_e = props.nodes) !== null && _e !== void 0 ? _e : [];
    }
    copy(props) {
        return copyStdNode(this, props);
    }
}
exports.VCSSAtRule = VCSSAtRule;
class VCSSUnknown extends HasParentNode {
    constructor(node, loc, start, end, props) {
        var _a;
        super(node, "VCSSUnknown", loc, start, end, props);
        this.nodes = (_a = props.nodes) !== null && _a !== void 0 ? _a : [];
        this.unknownType = props.unknownType;
    }
    copy(props) {
        return copyStdNode(this, props);
    }
}
exports.VCSSUnknown = VCSSUnknown;
class VCSSSelector extends HasParentNode {
    constructor(node, loc, start, end, props) {
        var _a;
        super(node, "VCSSSelector", loc, start, end, props);
        this.nodes = (_a = props.nodes) !== null && _a !== void 0 ? _a : [];
        this.parent = props.parent;
    }
    copy(props) {
        return copyStdNode(this, props);
    }
    get selector() {
        return this.nodes.map((n) => n.selector).join("");
    }
}
exports.VCSSSelector = VCSSSelector;
class VCSSTypeSelector extends HasParentNode {
    constructor(node, loc, start, end, props) {
        super(node, "VCSSTypeSelector", loc, start, end, props);
        this.value = getProp(props, node, "value");
        this.selector = this.value;
    }
    copy(props) {
        return copyStdNode(this, props);
    }
}
exports.VCSSTypeSelector = VCSSTypeSelector;
class VCSSIDSelector extends HasParentNode {
    constructor(node, loc, start, end, props) {
        super(node, "VCSSIDSelector", loc, start, end, props);
        this.value = getProp(props, node, "value");
        this.selector = `#${this.value}`;
    }
    copy(props) {
        return copyStdNode(this, props);
    }
}
exports.VCSSIDSelector = VCSSIDSelector;
class VCSSClassSelector extends HasParentNode {
    constructor(node, loc, start, end, props) {
        super(node, "VCSSClassSelector", loc, start, end, props);
        this.value = getProp(props, node, "value");
        this.selector = `.${this.value}`;
    }
    copy(props) {
        return copyStdNode(this, props);
    }
}
exports.VCSSClassSelector = VCSSClassSelector;
class VCSSNestingSelector extends HasParentNode {
    constructor(node, loc, start, end, props) {
        super(node, "VCSSNestingSelector", loc, start, end, props);
        this.value = getProp(props, node, "value");
        this.selector = this.value;
    }
    copy(props) {
        return copyStdNode(this, props);
    }
}
exports.VCSSNestingSelector = VCSSNestingSelector;
class VCSSUniversalSelector extends HasParentNode {
    constructor(node, loc, start, end, props) {
        super(node, "VCSSUniversalSelector", loc, start, end, props);
        this.value = getProp(props, node, "value");
        this.selector = this.value;
    }
    copy(props) {
        return copyStdNode(this, props);
    }
}
exports.VCSSUniversalSelector = VCSSUniversalSelector;
class VCSSAttributeSelector extends HasParentNode {
    constructor(node, loc, start, end, props) {
        super(node, "VCSSAttributeSelector", loc, start, end, props);
        this.attribute = getProp(props, node, "attribute");
        const operator = getProp(props, node, "operator");
        this.operator = operator !== null && operator !== void 0 ? operator : null;
        const value = getProp(props, node, "value");
        this.value = value !== null && value !== void 0 ? value : null;
        const quoteMark = getProp(props, node, "quoteMark");
        this.quoteMark = quoteMark !== null && quoteMark !== void 0 ? quoteMark : null;
        const raws = node.raws;
        if (props.insensitiveFlag != null) {
            this.insensitiveFlag = props.insensitiveFlag;
        }
        else if (raws.insensitiveFlag != null) {
            this.insensitiveFlag = raws.insensitiveFlag;
        }
        else if (node.insensitive) {
            this.insensitiveFlag = "i";
        }
        else {
            this.insensitiveFlag = null;
        }
        this.selector = this.refreshSelector();
    }
    refreshSelector() {
        let selector = `[${this.attribute}`;
        if (this.operator != null) {
            selector += this.operator;
            if (this.value != null) {
                selector += this.quoteMark
                    ? this.quoteMark + this.value + this.quoteMark
                    : this.value;
            }
        }
        if (this.insensitiveFlag != null) {
            selector += ` ${this.insensitiveFlag}`;
        }
        selector += "]";
        return selector;
    }
    copy(props) {
        return copyStdNode(this, props);
    }
}
exports.VCSSAttributeSelector = VCSSAttributeSelector;
class VCSSSelectorPseudo extends HasParentNode {
    constructor(node, loc, start, end, props) {
        var _a;
        super(node, "VCSSSelectorPseudo", loc, start, end, props);
        this.value = getProp(props, node, "value");
        this.nodes = (_a = props.nodes) !== null && _a !== void 0 ? _a : [];
    }
    copy(props) {
        return copyStdNode(this, props);
    }
    get selector() {
        if (!this.nodes.length) {
            return this.value;
        }
        const params = this.nodes.map((n) => n.selector).join(",");
        return `${this.value}(${params})`;
    }
}
exports.VCSSSelectorPseudo = VCSSSelectorPseudo;
class VCSSSelectorCombinator extends HasParentNode {
    constructor(node, loc, start, end, props) {
        super(node, "VCSSSelectorCombinator", loc, start, end, props);
        this.value = getProp(props, node, "value");
        this.selector = this.value;
    }
    copy(props) {
        return copyStdNode(this, props);
    }
}
exports.VCSSSelectorCombinator = VCSSSelectorCombinator;
class VCSSUnknownSelector extends HasParentNode {
    constructor(node, loc, start, end, props) {
        super(node, "VCSSUnknownSelector", loc, start, end, props);
        this.value = getProp(props, node, "value") || "";
        this.selector = this.value;
    }
    copy(props) {
        return copyStdNode(this, props);
    }
}
exports.VCSSUnknownSelector = VCSSUnknownSelector;
class VCSSComment extends HasParentNode {
    constructor(node, text, loc, start, end, props) {
        super(node, "VCSSComment", loc, start, end, props);
        this.node = node;
        this.text = text;
    }
    copy(props) {
        var _a, _b, _c, _d, _e, _f;
        const parent = (_a = props === null || props === void 0 ? void 0 : props.parent) !== null && _a !== void 0 ? _a : this.parent;
        return new VCSSComment((_b = props === null || props === void 0 ? void 0 : props.node) !== null && _b !== void 0 ? _b : this.node, (_c = props === null || props === void 0 ? void 0 : props.text) !== null && _c !== void 0 ? _c : this.text, (_d = props === null || props === void 0 ? void 0 : props.loc) !== null && _d !== void 0 ? _d : this.loc, (_e = props === null || props === void 0 ? void 0 : props.start) !== null && _e !== void 0 ? _e : this.start, (_f = props === null || props === void 0 ? void 0 : props.end) !== null && _f !== void 0 ? _f : this.end, Object.assign(Object.assign(Object.assign({}, this), props), { parent }));
    }
}
exports.VCSSComment = VCSSComment;
class VCSSInlineComment extends HasParentNode {
    constructor(node, text, loc, start, end, props) {
        super(node, "VCSSInlineComment", loc, start, end, props);
        this.node = node;
        this.text = text;
    }
    copy(props) {
        var _a, _b, _c, _d, _e, _f;
        const parent = (_a = props === null || props === void 0 ? void 0 : props.parent) !== null && _a !== void 0 ? _a : this.parent;
        return new VCSSInlineComment((_b = props === null || props === void 0 ? void 0 : props.node) !== null && _b !== void 0 ? _b : this.node, (_c = props === null || props === void 0 ? void 0 : props.text) !== null && _c !== void 0 ? _c : this.text, (_d = props === null || props === void 0 ? void 0 : props.loc) !== null && _d !== void 0 ? _d : this.loc, (_e = props === null || props === void 0 ? void 0 : props.start) !== null && _e !== void 0 ? _e : this.start, (_f = props === null || props === void 0 ? void 0 : props.end) !== null && _f !== void 0 ? _f : this.end, Object.assign(Object.assign(Object.assign({}, this), props), { parent }));
    }
}
exports.VCSSInlineComment = VCSSInlineComment;
function getProp(props, node, name) {
    if ((props === null || props === void 0 ? void 0 : props[name]) != null) {
        const v = props[name];
        return v;
    }
    return node[name];
}
function copyStdNode(astNode, props) {
    var _a, _b, _c, _d;
    const C = astNode.constructor;
    return new C((_a = props === null || props === void 0 ? void 0 : props.node) !== null && _a !== void 0 ? _a : astNode.node, (_b = props === null || props === void 0 ? void 0 : props.loc) !== null && _b !== void 0 ? _b : astNode.loc, (_c = props === null || props === void 0 ? void 0 : props.start) !== null && _c !== void 0 ? _c : astNode.start, (_d = props === null || props === void 0 ? void 0 : props.end) !== null && _d !== void 0 ? _d : astNode.end, Object.assign(Object.assign({}, astNode), props));
}

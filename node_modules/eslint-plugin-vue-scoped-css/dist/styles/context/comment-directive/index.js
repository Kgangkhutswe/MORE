"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommentDirectivesReporter = exports.createCommentDirectives = exports.CommentDirectivesReporter = exports.CommentDirectives = void 0;
const COMMENT_DIRECTIVE_B = /^\s*(eslint-(?:en|dis)able)(?:\s+(\S|\S[\s\S]*\S))?\s*$/u;
const COMMENT_DIRECTIVE_L = /^\s*(eslint-disable(?:-next)?-line)(?:\s+(\S|\S[\s\S]*\S))?\s*$/u;
function stripDirectiveComment(value) {
    return value.split(/\s-{2,}\s/u)[0];
}
function parse(pattern, comment) {
    const match = pattern.exec(stripDirectiveComment(comment));
    if (match == null) {
        return null;
    }
    const type = match[1];
    const rules = (match[2] || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    return { type, rules };
}
function enable(commentDirectives, loc, rules) {
    if (rules.length === 0) {
        commentDirectives.enableAll(loc);
    }
    else {
        commentDirectives.enableRules(loc, rules);
    }
}
function disable(commentDirectives, loc, rules) {
    if (rules.length === 0) {
        commentDirectives.disableAll(loc);
    }
    else {
        commentDirectives.disableRules(loc, rules);
    }
}
function processBlock(commentDirectives, comment) {
    const parsed = parse(COMMENT_DIRECTIVE_B, comment.text);
    if (parsed != null) {
        if (parsed.type === "eslint-disable") {
            disable(commentDirectives, comment.loc.start, parsed.rules);
        }
        else {
            enable(commentDirectives, comment.loc.start, parsed.rules);
        }
    }
}
function processLine(commentDirectives, comment) {
    const parsed = parse(COMMENT_DIRECTIVE_L, comment.text);
    if (parsed != null && comment.loc.start.line === comment.loc.end.line) {
        const line = comment.loc.start.line + (parsed.type === "eslint-disable-line" ? 0 : 1);
        const column = -1;
        if (!parsed.rules.length) {
            commentDirectives.disableLineAll({ line, column });
        }
        else {
            commentDirectives.disableLineRules({ line, column }, parsed.rules);
        }
    }
}
class CommentDirectives {
    constructor(styles) {
        this._disableLines = {};
        this._disableBlocks = {};
        for (const style of styles) {
            const cssNode = style.cssNode;
            if (cssNode != null) {
                for (const comment of cssNode.comments) {
                    processBlock(this, comment);
                    processLine(this, comment);
                }
                this.clear(cssNode.loc.end);
            }
        }
        for (const rule of Object.keys(this._disableBlocks)) {
            this._disableBlocks[rule].sort((a, b) => compareLoc(a.loc, b.loc));
        }
    }
    disableLineAll(loc) {
        const disableLine = this._disableLines[loc.line] ||
            (this._disableLines[loc.line] = { all: true });
        disableLine.all = true;
    }
    disableLineRules(loc, rules) {
        const disableLine = this._disableLines[loc.line] ||
            (this._disableLines[loc.line] = { all: false });
        for (const rule of rules) {
            disableLine[rule] = true;
        }
    }
    disableAll(loc) {
        const disableBlock = this._disableBlocks.all || (this._disableBlocks.all = []);
        disableBlock.push({ loc, disable: true });
    }
    disableRules(loc, rules) {
        for (const rule of rules) {
            const disableBlock = this._disableBlocks[rule] || (this._disableBlocks[rule] = []);
            disableBlock.push({ loc, disable: true });
        }
    }
    enableAll(loc) {
        const disableBlock = this._disableBlocks.all || (this._disableBlocks.all = []);
        disableBlock.push({ loc, disable: false });
    }
    enableRules(loc, rules) {
        for (const rule of rules) {
            const disableBlock = this._disableBlocks[rule] || (this._disableBlocks[rule] = []);
            disableBlock.push({ loc, disable: false });
        }
    }
    clear(loc) {
        for (const rule of Object.keys(this._disableBlocks)) {
            this._disableBlocks[rule].push({ loc, disable: false });
        }
    }
    isEnabled(rule, descriptor) {
        var _a;
        const loc = hasSourceLocation(descriptor)
            ? descriptor.loc
            : (_a = descriptor.node) === null || _a === void 0 ? void 0 : _a.loc;
        if (!loc) {
            return false;
        }
        const locStart = loc.start || loc;
        const disableLine = this._disableLines[locStart.line];
        if (disableLine) {
            if (disableLine.all || disableLine[rule]) {
                return false;
            }
        }
        for (const ruleId of [rule, "all"]) {
            const disableBlock = this._disableBlocks[ruleId];
            if (disableBlock) {
                let disableState = false;
                for (const block of disableBlock) {
                    if (compareLoc(locStart, block.loc) < 0) {
                        break;
                    }
                    disableState = block.disable;
                }
                if (disableState) {
                    return false;
                }
            }
        }
        return true;
    }
}
exports.CommentDirectives = CommentDirectives;
class CommentDirectivesReporter {
    constructor(context, commentDirectives) {
        this.context = context;
        this.commentDirectives = commentDirectives;
    }
    report(descriptor) {
        if (this.commentDirectives.isEnabled(this.context.id, descriptor)) {
            this.context.report(descriptor);
        }
    }
}
exports.CommentDirectivesReporter = CommentDirectivesReporter;
function createCommentDirectives(styleContexts) {
    return new CommentDirectives(styleContexts);
}
exports.createCommentDirectives = createCommentDirectives;
function createCommentDirectivesReporter(context, commentDirectives) {
    return new CommentDirectivesReporter(context, commentDirectives);
}
exports.createCommentDirectivesReporter = createCommentDirectivesReporter;
function compare(a, b) {
    return a === b ? 0 : a > b ? 1 : -1;
}
function compareLoc(a, b) {
    const lc = compare(a.line, b.line);
    if (lc !== 0) {
        return lc;
    }
    return compare(a.column, b.column);
}
function hasSourceLocation(descriptor) {
    return descriptor.loc != null;
}

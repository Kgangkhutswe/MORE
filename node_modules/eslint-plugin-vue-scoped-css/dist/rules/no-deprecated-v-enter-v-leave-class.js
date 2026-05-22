"use strict";
const context_1 = require("../styles/context");
const templates_1 = require("../utils/templates");
const attribute_tracker_1 = require("../styles/selectors/query/attribute-tracker");
const template_1 = require("../styles/template");
const selectors_1 = require("../styles/utils/selectors");
const css_nodes_1 = require("../styles/utils/css-nodes");
module.exports = {
    meta: {
        docs: {
            description: "disallow v-enter and v-leave classes.",
            categories: [],
            default: "warn",
            url: "https://future-architect.github.io/eslint-plugin-vue-scoped-css/rules/no-deprecated-v-enter-v-leave-class.html",
        },
        fixable: null,
        messages: {
            deprecatedClass: "The `v-{{kind}}` class is renamed in Vue 3.",
            deprecatedProps: "The `{{kind}}-class` prop is renamed in Vue 3. Rename to `{{kind}}-from-class`.",
        },
        schema: [],
        type: "suggestion",
    },
    create(context) {
        const styles = (0, context_1.getStyleContexts)(context)
            .filter(context_1.isValidStyleContext)
            .filter((style) => style.scoped);
        const reporter = (0, context_1.getCommentDirectivesReporter)(context);
        const deprecatedClassNames = new Map();
        const renamedClassNames = new Map();
        function report(node, messageId, kind) {
            reporter.report({
                node,
                loc: node.loc,
                messageId,
                data: { kind },
            });
        }
        function addDeprecatedClassName(className, kind) {
            deprecatedClassNames.set(className.string || className, {
                className,
                kind,
            });
        }
        function addRenamedClassName(className) {
            renamedClassNames.set(className.string || className, {
                className,
            });
        }
        function verifyCSSSelector(selector) {
            const deprecatedClasses = new Map();
            const renamedClasses = new Set();
            let skipChild = false;
            verifyInternal(selector);
            for (const [node, kind] of deprecatedClasses) {
                if (!renamedClasses.has(`${node.value}-from`)) {
                    report(node, "deprecatedClass", kind);
                }
            }
            return !skipChild;
            function verifyInternal(nodes) {
                for (const node of nodes) {
                    if ((0, selectors_1.isDeepCombinator)(node) || (0, selectors_1.isVueSpecialPseudo)(node)) {
                        skipChild = true;
                        break;
                    }
                    if (node.type === "VCSSClassSelector") {
                        for (const { className, kind } of deprecatedClassNames.values()) {
                            if (className.matchString(node.value)) {
                                deprecatedClasses.set(node, kind);
                                break;
                            }
                        }
                        for (const { className } of renamedClassNames.values()) {
                            if (className.matchString(node.value)) {
                                renamedClasses.add(node.value);
                                break;
                            }
                        }
                    }
                    else if (node.type === "VCSSSelectorPseudo" ||
                        node.type === "VCSSSelector") {
                        verifyInternal(node.nodes);
                    }
                }
                return !skipChild;
            }
        }
        function isIgnoreNode(node) {
            return ((0, css_nodes_1.isVCSSAtRule)(node) &&
                node.name === "keyframes" &&
                node.identifier === "@");
        }
        function verifyCSSNode(node) {
            if (isIgnoreNode(node)) {
                return;
            }
            if (node.type === "VCSSStyleRule") {
                if (!verifyCSSSelector(node.selectors)) {
                    return;
                }
                for (const child of node.nodes) {
                    verifyCSSNode(child);
                }
            }
            else if (node.type === "VCSSAtRule") {
                if (node.selectors) {
                    if (!verifyCSSSelector(node.selectors)) {
                        return;
                    }
                }
                for (const child of node.nodes) {
                    verifyCSSNode(child);
                }
            }
        }
        function verifyTransitionElementNode(node) {
            const enterAttr = (0, templates_1.findAttribute)(node, "enter-class");
            const enterFromAttr = (0, templates_1.findAttribute)(node, "enter-from-class");
            if (enterAttr && !enterFromAttr) {
                report(enterAttr.key, "deprecatedProps", "enter");
            }
            const leaveAttr = (0, templates_1.findAttribute)(node, "leave-class");
            const leaveFromAttr = (0, templates_1.findAttribute)(node, "leave-from-class");
            if (leaveAttr && !leaveFromAttr) {
                report(leaveAttr.key, "deprecatedProps", "leave");
            }
            return {
                hasEnterClass: enterAttr || enterFromAttr,
                hasLeaveClass: leaveAttr || leaveFromAttr,
            };
        }
        return {
            "Program:exit"() {
                for (const transition of (0, templates_1.getElements)(context, (element) => (0, templates_1.isTransitionElement)(element) || (0, templates_1.isTransitionGroupElement)(element))) {
                    const { hasEnterClass, hasLeaveClass } = verifyTransitionElementNode(transition);
                    if (hasEnterClass && hasLeaveClass) {
                        continue;
                    }
                    const nodes = (0, attribute_tracker_1.getAttributeValueNodes)(transition, "name", context);
                    if (!nodes) {
                        return;
                    }
                    if (!nodes.length) {
                        if (!hasEnterClass) {
                            addDeprecatedClassName(template_1.Template.of("v-enter"), "enter");
                            addRenamedClassName(template_1.Template.of("v-enter-from"));
                        }
                        if (!hasLeaveClass) {
                            addDeprecatedClassName(template_1.Template.of("v-leave"), "leave");
                            addRenamedClassName(template_1.Template.of("v-leave-from"));
                        }
                    }
                    else {
                        for (const name of nodes) {
                            const value = template_1.Template.ofNode(name);
                            if (value == null) {
                                return;
                            }
                            if (!hasEnterClass) {
                                addDeprecatedClassName(value.concat("-enter"), "enter");
                                addRenamedClassName(value.concat("-enter-from"));
                            }
                            if (!hasLeaveClass) {
                                addDeprecatedClassName(value.concat("-leave"), "leave");
                                addRenamedClassName(value.concat("-leave-from"));
                            }
                        }
                    }
                }
                for (const style of styles) {
                    for (const node of style.cssNode.nodes) {
                        verifyCSSNode(node);
                    }
                }
            },
        };
    },
};

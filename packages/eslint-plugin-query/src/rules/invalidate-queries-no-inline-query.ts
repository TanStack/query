import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import { createRule, isValidQueryNode } from "../utils.js";

const name = "invalidate-queries-no-inline-query";

export default {
  name,
  rule: createRule({
    name,
    defaultOptions: [],
    meta: {
      type: "suggestion",
      messages: {
        "no-inline-query": "Expected query hook to use queryOptions pattern",
      },
      docs: {
        description:
          "Enforces queryClient.invalidateQueries don't have inline queries. Will error if queryKey or queryFn properties are passed to the function",
      },
      schema: [],
    },
    create(context) {
      return {
        CallExpression(node) {
          if (
            // check queryClient.invalidateQueries
            node.callee.type === AST_NODE_TYPES.MemberExpression &&
            node.callee.object.type === AST_NODE_TYPES.Identifier &&
            node.callee.object.name === "queryClient" &&
            node.callee.property.type === AST_NODE_TYPES.Identifier &&
            node.callee.property.name === "invalidateQueries"
          ) {
            if (!node.arguments[0]) return;

            if (!isValidQueryNode(node.arguments[0]))
              context.report({
                messageId: "no-inline-query",
                node,
              });
          }
        },
      };
    },
  }),
};

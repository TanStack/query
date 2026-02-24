import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import { createRule, isValidQueryNode } from "../utils.js";

const useQueryHooks = [
  // see https://tanstack.com/query/latest/docs/framework/react/reference/useQuery
  "useQuery",
  "useQueries",
  "useInfiniteQuery",
  "useSuspenseQuery",
  "useSuspenseQueries",
  "useSuspenseInfiniteQuery",
];

const name = "use-query-no-inline-query";

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
          "Enforces useQuery (and family) hooks use some form of query constructor pattern. Will error if queryKey or queryFn properties are passed to the hook",
      },
      schema: [],
    },
    create(context) {
      return {
        CallExpression(node) {
          if (node.callee.type !== AST_NODE_TYPES.Identifier) return;
          if (!useQueryHooks.includes(node.callee.name)) return;

          // use*Query hook call
          if (!node.arguments[0]) return;

          // if if caller first argument is an object
          const queryNode = node.arguments[0];

          if (!isValidQueryNode(queryNode))
            context.report({
              messageId: "no-inline-query",
              node,
            });
        },
      };
    },
  }),
};

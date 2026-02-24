import {
  AST_NODE_TYPES,
  ESLintUtils,
  TSESTree,
} from "@typescript-eslint/utils";

export const INVALID_QUERY_PROPERTIES = ["queryKey", "queryFn"];

export const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/danielpza/eslint-plugin-react-query/docs/rules/${name}.md`,
);

export function isValidQueryNode(queryNode: TSESTree.Node) {
  // we only care about object expressions
  if (queryNode.type !== AST_NODE_TYPES.ObjectExpression) return true;

  // check if any of the properties is queryKey or queryFn
  const hasInvalidProperties = queryNode.properties.find(
    (property) =>
      property.type === AST_NODE_TYPES.Property &&
      property.key.type === AST_NODE_TYPES.Identifier &&
      INVALID_QUERY_PROPERTIES.includes(property.key.name),
  );

  return !hasInvalidProperties;
}

import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { ASTUtils } from '../ast-utils'
import {
  findVariable,
  getImport,
  getProvenance,
  isModuleLevel,
} from './provenance'
import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import type { ModuleGraph } from './module-graph'
import type { Provenance, ProvenanceEnvironment } from './provenance'

const queryOptionsBuilders = ['queryOptions', 'infiniteQueryOptions']

/**
 * What a query options argument was built from.
 */
export type QueryOptionsSource =
  /** Options built by calling a factory or referencing a value, which can be compared by provenance. */
  | { type: 'tracked'; provenance: Provenance }
  /**
   * Options written inline, which are compared by their `queryKey`. `hoistable` is `true` if they
   * only depend on values that are also available outside of render.
   */
  | { type: 'inline'; hoistable: boolean; queryKey: Provenance | null }
  /** Options that depend on values that only exist at render time. */
  | { type: 'untracked' }

/**
 * Describes what query options passed to a hook or a `QueryClient` method were built from.
 * @param node - The options argument.
 * @param env - The routing environment.
 * @param isQueryImport - Checks whether an identifier is imported from TanStack Query.
 * @returns The options' source.
 */
export function resolveQueryOptions(
  node: TSESTree.Node,
  env: ProvenanceEnvironment,
  isQueryImport: (source: string) => boolean,
): QueryOptionsSource {
  node = unwrap(node)

  if (node.type === AST_NODE_TYPES.Identifier) {
    const init = getLocalConstInit(env.graph, node)
    if (init !== null) {
      return resolveQueryOptions(init, env, isQueryImport)
    }
  }

  if (node.type === AST_NODE_TYPES.ObjectExpression) {
    const [spread] = node.properties
    // `{ ...postOptions(id), select }` has the same key and fn as `postOptions(id)`.
    if (
      spread?.type === AST_NODE_TYPES.SpreadElement &&
      node.properties.filter((p) => p.type === AST_NODE_TYPES.SpreadElement)
        .length === 1 &&
      ASTUtils.findPropertyWithIdentifierKey(node.properties, 'queryKey') ===
        undefined &&
      ASTUtils.findPropertyWithIdentifierKey(node.properties, 'queryFn') ===
        undefined
    ) {
      return resolveQueryOptions(spread.argument, env, isQueryImport)
    }
    return inline(node, node, env)
  }

  if (
    node.type === AST_NODE_TYPES.CallExpression &&
    node.callee.type === AST_NODE_TYPES.Identifier
  ) {
    const imported = getImport(env.graph, node.callee)
    if (
      imported !== null &&
      isQueryImport(imported.source) &&
      queryOptionsBuilders.includes(imported.name)
    ) {
      return inline(node, node.arguments[0], env)
    }
  }

  const provenance = getProvenance(node, env)
  return provenance === null
    ? { type: 'untracked' }
    : { type: 'tracked', provenance }
}

/**
 * Describes inline query options.
 * @param node - The options, or the `queryOptions()` call.
 * @param options - The options object.
 * @param env - The routing environment.
 * @returns Whether the options can be hoisted, and the provenance of their `queryKey`.
 */
function inline(
  node: TSESTree.Node,
  options: TSESTree.Node | undefined,
  env: ProvenanceEnvironment,
): QueryOptionsSource {
  const queryKey =
    options?.type === AST_NODE_TYPES.ObjectExpression
      ? ASTUtils.findPropertyWithIdentifierKey(options.properties, 'queryKey')
          ?.value
      : undefined
  return {
    type: 'inline',
    hoistable: isHoistable(node, env),
    queryKey: queryKey ? getProvenance(queryKey, env) : null,
  }
}

/**
 * Checks whether every value an expression reads from outside of itself can be tracked, so the same
 * expression could be written outside of render.
 * @param node - The inline query options.
 * @param env - The routing environment, used to track the values read.
 * @returns `true` if no value it reads only exists at render time.
 */
function isHoistable(node: TSESTree.Node, env: ProvenanceEnvironment): boolean {
  const [start, end] = node.range
  const isInside = (inner: TSESTree.Node) =>
    inner.range[0] >= start && inner.range[1] <= end

  const references: Array<TSESLint.Scope.Reference> = []
  const collect = (scope: TSESLint.Scope.Scope) => {
    references.push(...scope.references)
    scope.childScopes.forEach(collect)
  }
  collect(env.graph.fileOf(node).source.getScope(node))

  return references.every((reference) => {
    if (!isInside(reference.identifier) || !reference.isValueReference) {
      return true
    }
    const definition = reference.resolved?.defs[0]
    if (definition !== undefined && isInside(definition.name)) {
      return true
    }
    return (
      reference.identifier.type !== AST_NODE_TYPES.Identifier ||
      getProvenance(reference.identifier, env) !== null
    )
  })
}

/**
 * Returns the initializer of a local `const` that an identifier refers to, to follow
 * `const options = postOptions(id)` to `postOptions(id)`.
 * @param graph - The module graph, used to resolve the identifier.
 * @param node - The identifier referring to the variable.
 * @returns The initializer, or `null` if the identifier doesn't refer to a local `const`.
 */
function getLocalConstInit(
  graph: ModuleGraph,
  node: TSESTree.Identifier,
): TSESTree.Expression | null {
  const variable = findVariable(graph, node)
  const definition = variable?.defs[0]
  if (
    variable === null ||
    isModuleLevel(variable) ||
    definition?.type !== 'Variable' ||
    definition.parent.kind !== 'const' ||
    definition.node.id !== definition.name
  ) {
    return null
  }
  return definition.node.init
}

/**
 * Removes type assertions and non-null assertions around a node.
 * @param node - The node to unwrap.
 * @returns The node inside the assertions.
 */
function unwrap(node: TSESTree.Node): TSESTree.Node {
  while (
    node.type === AST_NODE_TYPES.TSAsExpression ||
    node.type === AST_NODE_TYPES.TSSatisfiesExpression ||
    node.type === AST_NODE_TYPES.TSTypeAssertion ||
    node.type === AST_NODE_TYPES.TSNonNullExpression
  ) {
    node = node.expression
  }
  return node
}

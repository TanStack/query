import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import {
  findVariable,
  getImport,
  getProvenance,
  isHookCall,
  resolveFunction,
  walk,
} from './provenance'
import { resolveQueryOptions } from './query-options'
import type { TSESTree } from '@typescript-eslint/utils'
import type { ModuleFile } from './module-graph'
import type {
  FunctionNode,
  Provenance,
  ProvenanceEnvironment,
} from './provenance'
import type { QueryOptionsSource } from './query-options'

/** The package query hooks and `QueryClient` helpers are imported from. */
const querySource = '@tanstack/react-query'

/** Query hooks, and the `QueryClient` method that prefetches what they use. */
export const queryHooks: Record<string, string> = {
  useQuery: 'query',
  useSuspenseQuery: 'query',
  useInfiniteQuery: 'infiniteQuery',
  useSuspenseInfiniteQuery: 'infiniteQuery',
}

/** `QueryClient` methods that start fetching a query, so its data is in flight before render. */
const prefetchMethods = [
  'query',
  'infiniteQuery',
  'fetchQuery',
  'prefetchQuery',
  'ensureQueryData',
  'fetchInfiniteQuery',
  'prefetchInfiniteQuery',
  'ensureInfiniteQueryData',
]

/** How deep components, hooks, and helpers are followed. */
const maxDepth = 25

/** How many functions are visited for one root, so large component trees stay fast. */
const maxVisits = 2000

/**
 * A function the analysis is visiting, and how it got there.
 */
export interface RenderFrame<TState> {
  /** The function. */
  fn: FunctionNode
  /** The file that declares the function. */
  file: ModuleFile
  /** The JSX element, hook call, or route option that led to the function. */
  via: TSESTree.Node
  /** What the analysis knows at this point, e.g. which queries have been prefetched. */
  state: TState
  /** The frame of the function that rendered or called this one. */
  parent: RenderFrame<TState> | null
}

/**
 * A call of a query hook.
 */
export interface QueryUsage {
  /** The name of the hook, e.g. `useSuspenseQuery`. */
  hook: string
  /** The options argument. */
  options: TSESTree.Node
  /** What the options were built from. */
  source: QueryOptionsSource
}

/**
 * A call of a `QueryClient` method that starts fetching a query.
 */
export interface Prefetch {
  /** The call. */
  call: TSESTree.CallExpression
  /** The options argument. */
  options: TSESTree.Node
  /** What the options were built from. */
  source: QueryOptionsSource
}

/**
 * A function to visit, and the values its parameters receive.
 */
export interface RenderRoot<TState> {
  /** The component to start from. */
  fn: FunctionNode
  /** The file that declares the component. */
  file: ModuleFile
  /** The values the component's parameters receive, e.g. its props. */
  args: Array<Provenance | null>
  /** The node in the file being linted that refers to the component, where problems are reported. */
  via: TSESTree.Node
  /** The state the walk starts with. */
  state: TState
}

/**
 * Callbacks for the functions, query hooks, and children found while walking a render tree.
 */
export interface RenderTreeVisitor<TState> {
  /**
   * Called when a function is entered, before its children are visited.
   * @returns The state for the function's body and children.
   */
  enter?: (frame: RenderFrame<TState>) => TState
  /**
   * Called for a component the function renders or a hook it calls.
   * @returns The state for the child, or `null` to skip it.
   */
  child?: (
    frame: RenderFrame<TState>,
    child: {
      fn: FunctionNode
      file: ModuleFile
      via: TSESTree.Node
      kind: 'component' | 'hook'
    },
  ) => TState | null
  /** Called for each query hook call in a visited function. */
  query: (usage: QueryUsage, frame: RenderFrame<TState>) => void
}

/**
 * Visits a component and the components it renders and hooks it calls, in the same file or in
 * imported files of the project, passing the props and arguments each one receives.
 * @param env - The routing environment.
 * @param root - The component to start from.
 * @param visitor - The callbacks.
 */
export function walkRenderTree<TState>(
  env: ProvenanceEnvironment,
  root: RenderRoot<TState>,
  visitor: RenderTreeVisitor<TState>,
): void {
  const active = new Set<FunctionNode>()
  let visits = 0

  const visit = (
    fn: FunctionNode,
    file: ModuleFile,
    args: Array<Provenance | null>,
    via: TSESTree.Node,
    state: TState,
    parent: RenderFrame<TState> | null,
    depth: number,
  ) => {
    if (active.has(fn) || depth > maxDepth || visits++ > maxVisits) {
      return
    }

    withBindings(env, fn, args, () => {
      active.add(fn)
      try {
        const frame: RenderFrame<TState> = { fn, file, via, state, parent }
        frame.state = visitor.enter?.(frame) ?? state

        walk(env.graph, fn.body, (node) => {
          if (node.type === AST_NODE_TYPES.CallExpression) {
            const usage = getQueryUsage(node, env)
            if (usage !== null) {
              visitor.query(usage, frame)
              return
            }
            if (
              isHookCall(node) &&
              node.callee.type === AST_NODE_TYPES.Identifier
            ) {
              const hook = resolveFunction(env.graph, node.callee)
              if (hook === null) {
                return
              }
              const childState = visitor.child
                ? visitor.child(frame, { ...hook, via: node, kind: 'hook' })
                : frame.state
              if (childState !== null) {
                visit(
                  hook.fn,
                  hook.file,
                  node.arguments.map((arg) => getProvenance(arg, env)),
                  node,
                  childState,
                  frame,
                  depth + 1,
                )
              }
            }
            return
          }

          if (node.type === AST_NODE_TYPES.JSXElement) {
            const component = resolveJsxComponent(node.openingElement, env)
            if (component === null) {
              return
            }
            const childState = visitor.child
              ? visitor.child(frame, {
                  ...component,
                  via: node.openingElement,
                  kind: 'component',
                })
              : frame.state
            if (childState !== null) {
              visit(
                component.fn,
                component.file,
                [getJsxProps(node, env)],
                node.openingElement,
                childState,
                frame,
                depth + 1,
              )
            }
          }
          return
        })
      } finally {
        active.delete(fn)
      }
    })
  }

  visit(root.fn, root.file, root.args, root.via, root.state, null, 0)
}

/**
 * Collects the queries a function starts fetching, including in helper functions it calls with the
 * query client, like `prefetchPost(queryClient, id)`.
 * @param env - The routing environment.
 * @param fn - The function, e.g. a loader or a server component.
 * @param args - The values the function's parameters receive.
 * @returns The prefetch calls.
 */
export function collectPrefetches(
  env: ProvenanceEnvironment,
  fn: FunctionNode,
  args: Array<Provenance | null>,
): Array<Prefetch> {
  const prefetches: Array<Prefetch> = []
  const active = new Set<FunctionNode>()

  const visit = (
    current: FunctionNode,
    currentArgs: Array<Provenance | null>,
    depth: number,
  ) => {
    if (active.has(current) || depth > maxDepth) {
      return
    }
    withBindings(env, current, currentArgs, () => {
      active.add(current)
      try {
        walk(env.graph, current.body, (node) => {
          if (node.type !== AST_NODE_TYPES.CallExpression) {
            return
          }
          const options = getPrefetchOptions(node)
          if (options !== null) {
            prefetches.push({
              call: node,
              options,
              source: resolveQueryOptions(options, env, isQuerySource),
            })
            return
          }
          if (
            node.callee.type === AST_NODE_TYPES.Identifier &&
            !isHookCall(node)
          ) {
            const helper = resolveFunction(env.graph, node.callee)
            if (helper !== null) {
              visit(
                helper.fn,
                node.arguments.map((arg) => getProvenance(arg, env)),
                depth + 1,
              )
            }
          }
        })
      } finally {
        active.delete(current)
      }
    })
  }

  visit(fn, args, 0)
  return prefetches
}

/**
 * Checks whether a node is rendered inside a `<HydrationBoundary>` within a function.
 * @param env - The routing environment, used to resolve the element names.
 * @param node - The node, e.g. a JSX element or `{children}`.
 * @param fn - The function that renders the node.
 * @returns `true` if a `HydrationBoundary` from TanStack Query encloses the node.
 */
export function isInsideHydrationBoundary(
  env: ProvenanceEnvironment,
  node: TSESTree.Node,
  fn: FunctionNode,
): boolean {
  for (
    let current: TSESTree.Node | undefined = node.parent;
    current !== undefined && current !== fn;
    current = current.parent
  ) {
    if (
      current.type === AST_NODE_TYPES.JSXElement &&
      current.openingElement.name.type === AST_NODE_TYPES.JSXIdentifier
    ) {
      const definition = findVariable(
        env.graph,
        current,
        current.openingElement.name.name,
      )?.defs[0]
      if (
        definition?.type === 'ImportBinding' &&
        definition.parent.type === AST_NODE_TYPES.ImportDeclaration &&
        definition.parent.source.value === querySource &&
        definition.node.type === AST_NODE_TYPES.ImportSpecifier &&
        definition.node.imported.type === AST_NODE_TYPES.Identifier &&
        definition.node.imported.name === 'HydrationBoundary'
      ) {
        return true
      }
    }
  }
  return false
}

/**
 * Checks whether a function calls `dehydrate()` from TanStack Query, as a server loader has to for its
 * prefetched queries to reach the client.
 * @param env - The routing environment.
 * @param fn - The function to check.
 * @returns `true` if the function calls `dehydrate()`.
 */
export function callsDehydrate(
  env: ProvenanceEnvironment,
  fn: FunctionNode,
): boolean {
  const visited = new Set<FunctionNode>()
  const visit = (current: FunctionNode, depth: number): boolean => {
    if (visited.has(current) || depth > maxDepth) {
      return false
    }
    visited.add(current)
    let found = false
    walk(env.graph, current.body, (node) => {
      if (
        node.type === AST_NODE_TYPES.CallExpression &&
        node.callee.type === AST_NODE_TYPES.Identifier
      ) {
        const imported = getImport(env.graph, node.callee)
        if (imported?.source === querySource && imported.name === 'dehydrate') {
          found = true
        } else if (imported?.source !== querySource) {
          // Follow helpers like `return hydrationData(queryClient)`.
          const helper = resolveFunction(env.graph, node.callee)
          found = helper !== null && visit(helper.fn, depth + 1)
        }
      }
      return !found
    })
    return found
  }
  return visit(fn, 0)
}

/**
 * Checks whether an import specifier is TanStack Query's.
 * @param source - The import specifier.
 * @returns `true` for `@tanstack/react-query`.
 */
function isQuerySource(source: string): boolean {
  return source === querySource
}

/**
 * Builds the props object a JSX element passes to its component.
 * @param node - The JSX element.
 * @param env - The routing environment, used to track the attribute values.
 * @returns The props, with the attributes that can't be tracked set to `null`, or `null` if a
 * spread attribute makes the props unknown.
 */
export function getJsxProps(
  node: TSESTree.JSXElement,
  env: ProvenanceEnvironment,
): Provenance | null {
  const properties: Array<[string, Provenance | null]> = []

  for (const attribute of node.openingElement.attributes) {
    if (attribute.type === AST_NODE_TYPES.JSXSpreadAttribute) {
      const spread = getProvenance(attribute.argument, env)
      if (spread?.type !== 'object') {
        return null
      }
      properties.push(...spread.properties)
      continue
    }
    if (attribute.name.type !== AST_NODE_TYPES.JSXIdentifier) {
      continue
    }
    const value = attribute.value
    let provenance: Provenance | null
    if (value === null) {
      provenance = { type: 'literal', value: 'boolean:true' }
    } else if (value.type === AST_NODE_TYPES.Literal) {
      provenance = getProvenance(value, env)
    } else if (
      value.type === AST_NODE_TYPES.JSXExpressionContainer &&
      value.expression.type !== AST_NODE_TYPES.JSXEmptyExpression
    ) {
      provenance = getProvenance(value.expression, env)
    } else {
      provenance = null
    }
    properties.push([attribute.name.name, provenance])
  }

  if (node.children.length > 0) {
    properties.push(['children', null])
  }

  // Later props override earlier ones, as with spreads.
  const deduplicated = new Map(properties)
  return { type: 'object', properties: [...deduplicated] }
}

/**
 * Runs a function with the values of another function's parameters set, restoring the previous
 * values afterwards.
 * @param env - The routing environment, whose bindings are changed.
 * @param fn - The function whose parameters are bound.
 * @param args - The values of the parameters.
 * @param run - The function to run.
 */
function withBindings(
  env: ProvenanceEnvironment,
  fn: FunctionNode,
  args: Array<Provenance | null>,
  run: () => void,
): void {
  const previous = env.parameterBindings.get(fn)
  env.parameterBindings.set(fn, args)
  try {
    run()
  } finally {
    if (previous === undefined) {
      env.parameterBindings.delete(fn)
    } else {
      env.parameterBindings.set(fn, previous)
    }
  }
}

/**
 * Finds the component a JSX element renders.
 * @param node - The opening element.
 * @param env - The routing environment, used to resolve the name.
 * @returns The component and its file, or `null` for intrinsic elements and unknown components.
 */
export function resolveJsxComponent(
  node: TSESTree.JSXOpeningElement,
  env: ProvenanceEnvironment,
): { fn: FunctionNode; file: ModuleFile } | null {
  if (
    node.name.type !== AST_NODE_TYPES.JSXIdentifier ||
    !/^[A-Z]/.test(node.name.name)
  ) {
    return null
  }
  const variable = findVariable(env.graph, node, node.name.name)
  const definition = variable?.defs[0]
  if (definition === undefined) {
    return null
  }
  return resolveFunction(env.graph, definition.name as TSESTree.Identifier)
}

/**
 * Reads a query hook call.
 * @param node - The call.
 * @param env - The routing environment.
 * @returns The usage, or `null` if the call isn't a query hook from TanStack Query.
 */
function getQueryUsage(
  node: TSESTree.CallExpression,
  env: ProvenanceEnvironment,
): QueryUsage | null {
  if (node.callee.type !== AST_NODE_TYPES.Identifier) {
    return null
  }
  const imported = getImport(env.graph, node.callee)
  const [options] = node.arguments
  if (
    imported === null ||
    !isQuerySource(imported.source) ||
    !(imported.name in queryHooks) ||
    options === undefined
  ) {
    return null
  }
  return {
    hook: imported.name,
    options,
    source: resolveQueryOptions(options, env, isQuerySource),
  }
}

/**
 * Returns the options of a `queryClient.query(options)` call, or of another method that starts
 * fetching a query.
 * @param node - The call to check.
 * @returns The options argument, or `null` if the call isn't one of these methods.
 */
function getPrefetchOptions(
  node: TSESTree.CallExpression,
): TSESTree.Node | null {
  if (
    node.callee.type !== AST_NODE_TYPES.MemberExpression ||
    node.callee.computed ||
    node.callee.property.type !== AST_NODE_TYPES.Identifier ||
    !prefetchMethods.includes(node.callee.property.name)
  ) {
    return null
  }
  return node.arguments[0] ?? null
}

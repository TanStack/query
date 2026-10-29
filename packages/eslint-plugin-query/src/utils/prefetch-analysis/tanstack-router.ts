import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { ASTUtils } from '../ast-utils'
import {
  findVariable,
  getImport,
  getProvenance,
  getReturnedExpression,
  isFunctionNode,
  isModuleLevel,
  resolveFunctionValue,
} from './provenance'
import type { TSESTree } from '@typescript-eslint/utils'
import type { LoaderCheck } from './checks'
import type { ModuleExport, ModuleGraph } from './module-graph'
import type {
  Provenance,
  ProvenanceEnvironment,
  ResolvedFunction,
} from './provenance'

// TanStack Start apps import their route factories from TanStack Router too.
const routerSources = ['@tanstack/react-router']

/** Route factories called with the route options: `createRoute({ ... })`. */
const routeFactories = ['createRoute', 'createRootRoute']

/** Route factories that return a function called with the route options: `createFileRoute('/')({ ... })`. */
const curriedRouteFactories = ['createFileRoute', 'createRootRouteWithContext']

/** Hooks that read route values, called as `useParams({ from: '/posts/$postId' })`. */
const routeHooks = [
  'useParams',
  'useSearch',
  'useRouteContext',
  'useLoaderDeps',
]

const params: Provenance = { type: 'binding', name: 'params' }
const search: Provenance = { type: 'binding', name: 'search' }
const context: Provenance = { type: 'binding', name: 'context' }

/**
 * A route defined in the file being analyzed.
 */
export interface RouteDefinition {
  /** The route's ID, if it is known statically: the path of a file route, or `__root__`. */
  id: string | null
  /** The export the route is assigned to, used to find `Route.useParams()` and similar calls. */
  identity: ModuleExport | null
  /** The node of the `component` option, where queries of imported components are reported. */
  componentNode: TSESTree.Node | null
  /** The route's `component`. */
  component: ResolvedFunction | null
  /** The route's `loader`. */
  loader: ResolvedFunction | null
  /** The route's `beforeLoad`. */
  beforeLoad: ResolvedFunction | null
  /** The route's `loaderDeps`. */
  loaderDeps: ResolvedFunction | null
}

/**
 * Reads a TanStack Router route definition from a call.
 * @param node - A call that may define a route.
 * @param graph - The module graph, used to resolve the route factory and route options.
 * @returns The route, or `null` if the call doesn't define one.
 */
export function getRouteDefinition(
  node: TSESTree.CallExpression,
  graph: ModuleGraph,
): RouteDefinition | null {
  const [options] = node.arguments

  if (
    options?.type !== AST_NODE_TYPES.ObjectExpression ||
    !isRouteFactoryCall(node, graph)
  ) {
    return null
  }

  const option = (key: string) =>
    ASTUtils.findPropertyWithIdentifierKey(options.properties, key)?.value ??
    null
  const resolve = (key: string) => {
    const value = option(key)
    return value === null ? null : resolveFunctionValue(graph, value)
  }

  return {
    id: getRouteId(node, graph),
    identity: getAssignedExport(node, graph),
    componentNode: option('component'),
    component: resolve('component'),
    loader: resolve('loader'),
    beforeLoad: resolve('beforeLoad'),
    loaderDeps: resolve('loaderDeps'),
  }
}

/**
 * Creates the checks for the routes of a file: the queries each route's component uses have to be
 * prefetched in the route's `loader` or `beforeLoad`.
 * @param graph - The module graph.
 * @param routes - The routes defined in the file.
 * @returns The environment and the checks, one per route with a component.
 */
export function getTanStackRouterChecks(
  graph: ModuleGraph,
  routes: Array<RouteDefinition>,
): { env: ProvenanceEnvironment; checks: Array<LoaderCheck> } {
  const env = createRouterEnvironment(graph, routes)
  const checks: Array<LoaderCheck> = []

  for (const route of routes) {
    if (route.component === null || route.componentNode === null) {
      continue
    }
    const deps = getLoaderDeps(env, route)
    const sites: LoaderCheck['sites'] = []
    if (route.loader !== null) {
      sites.push({
        fn: route.loader.fn,
        args: [
          {
            type: 'object',
            open: true,
            properties: [
              ['params', params],
              ['context', context],
              ['deps', deps],
            ],
          },
        ],
      })
    }
    if (route.beforeLoad !== null) {
      sites.push({
        fn: route.beforeLoad.fn,
        args: [
          {
            type: 'object',
            open: true,
            properties: [
              ['params', params],
              ['context', context],
              ['search', search],
            ],
          },
        ],
      })
    }
    checks.push({
      site: "this route's loader",
      sites,
      root: {
        fn: route.component.fn,
        file: route.component.file,
        args: [],
        via: route.componentNode,
        state: undefined,
      },
    })
  }

  return { env, checks }
}

/**
 * Creates the provenance environment for the routes of a file: values read through
 * `Route.useParams()`, `Route.useSearch()`, `Route.useRouteContext()`, and `Route.useLoaderDeps()`,
 * the same hooks of `getRouteApi()`, or the same hooks called with `from`.
 * @param graph - The module graph, used to resolve variables.
 * @param routes - The routes defined in the file.
 * @returns The environment, shared by all routes of the file.
 */
function createRouterEnvironment(
  graph: ModuleGraph,
  routes: Array<RouteDefinition>,
): ProvenanceEnvironment {
  const parameterBindings: ProvenanceEnvironment['parameterBindings'] =
    new Map()

  const env: ProvenanceEnvironment = {
    graph,
    parameterBindings,
    resolveCall: (node) => {
      const call = getRouteHookCall(node, routes, graph)

      if (call === undefined) {
        return undefined
      }

      if (call === null) {
        return null
      }

      const value =
        call.hook === 'useLoaderDeps'
          ? // Loader deps belong to one route, so they need a route from this file.
            call.route && getLoaderDeps(env, call.route)
          : // A loader receives the params, search params, and context of its parent routes too, so
            // these values can be read from any parent route.
            { useParams: params, useSearch: search, useRouteContext: context }[
              call.hook
            ]

      return value ? applySelect(node, value, env) : null
    },
  }

  for (const route of routes) {
    if (route.loaderDeps !== null) {
      parameterBindings.set(route.loaderDeps.fn, [
        { type: 'object', open: true, properties: [['search', search]] },
      ])
    }
  }

  return env
}

/**
 * Returns the `deps` a route's loader receives: the value its `loaderDeps` returns.
 * @param env - The routing environment.
 * @param route - The route whose loader receives the deps.
 * @returns The provenance of the deps, an empty object if the route has no `loaderDeps`.
 */
function getLoaderDeps(
  env: ProvenanceEnvironment,
  route: RouteDefinition,
): Provenance {
  const returned =
    route.loaderDeps === null
      ? null
      : getReturnedExpression(route.loaderDeps.fn)
  return (
    (returned === null ? null : getProvenance(returned, env)) ??
      // Without `loaderDeps`, the loader's `deps` is an empty object.
      { type: 'object', properties: [] }
  )
}

/**
 * Applies the `select` option of `Route.useParams({ select })` and similar hooks.
 * @param node - The hook call.
 * @param value - The provenance of the value the hook returns without `select`.
 * @param env - The routing environment, which `select`'s parameter is added to.
 * @returns The provenance of the selected value, or `null` if `select` can't be followed.
 */
function applySelect(
  node: TSESTree.CallExpression,
  value: Provenance,
  env: ProvenanceEnvironment,
): Provenance | null {
  const [options] = node.arguments

  if (options === undefined) {
    return value
  }

  if (options.type !== AST_NODE_TYPES.ObjectExpression) {
    return null
  }

  const select = ASTUtils.findPropertyWithIdentifierKey(
    options.properties,
    'select',
  )?.value

  if (select === undefined) {
    return value
  }

  if (!isFunctionNode(select)) {
    return null
  }

  const returned = getReturnedExpression(select)

  if (returned === null) {
    return null
  }

  env.parameterBindings.set(select, [value])
  return getProvenance(returned, env)
}

/**
 * Reads which route value a hook call reads: `Route.useParams()` and similar calls on a route of the
 * file, the same calls on `getRouteApi(id)`, or `useParams({ from })` and similar calls imported from
 * TanStack Router.
 * @param node - The call that may read a route value.
 * @param routes - The routes defined in the file.
 * @param graph - The module graph, used to resolve the route and the hook's import.
 * @returns The hook and the route it reads from, which is `null` if it isn't defined in this file;
 * `null` if the call reads a route value of an unknown route, as with `strict: false`; or `undefined`
 * if the call doesn't read a route value.
 */
function getRouteHookCall(
  node: TSESTree.CallExpression,
  routes: Array<RouteDefinition>,
  graph: ModuleGraph,
): { hook: string; route: RouteDefinition | null } | null | undefined {
  if (
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.property.type === AST_NODE_TYPES.Identifier &&
    routeHooks.includes(node.callee.property.name)
  ) {
    const hook = node.callee.property.name
    const route = findRoute(node.callee.object, routes, graph)
    if (route !== undefined) {
      return { hook, route }
    }
    const routeApiId = getRouteApiId(node.callee.object, graph)
    if (routeApiId !== null) {
      return {
        hook,
        route: routes.find((candidate) => candidate.id === routeApiId) ?? null,
      }
    }
    return undefined
  }

  if (node.callee.type !== AST_NODE_TYPES.Identifier) {
    return undefined
  }

  const imported = getImport(graph, node.callee)

  if (
    imported === null ||
    !routerSources.includes(imported.source) ||
    !routeHooks.includes(imported.name)
  ) {
    return undefined
  }

  const [options] = node.arguments
  const from =
    options?.type === AST_NODE_TYPES.ObjectExpression
      ? ASTUtils.findPropertyWithIdentifierKey(options.properties, 'from')
          ?.value
      : undefined

  // `from: '/posts/$postId'`
  if (from?.type === AST_NODE_TYPES.Literal && typeof from.value === 'string') {
    const id = from.value
    return {
      hook: imported.name,
      route: routes.find((route) => route.id === id) ?? null,
    }
  }

  // `from: Route.id` or `from: Route.fullPath`
  if (
    from?.type === AST_NODE_TYPES.MemberExpression &&
    from.property.type === AST_NODE_TYPES.Identifier &&
    ['id', 'fullPath'].includes(from.property.name)
  ) {
    const route = findRoute(from.object, routes, graph)
    return route ? { hook: imported.name, route } : null
  }

  return null
}

/**
 * Finds the route of this file a variable refers to, including through an import of the route in
 * another file.
 * @param node - The node that may refer to a route, e.g. `Route` in `Route.useParams()`.
 * @param routes - The routes defined in the file.
 * @param graph - The module graph, used to resolve the variable.
 * @returns The route, or `undefined` if the node doesn't refer to one.
 */
function findRoute(
  node: TSESTree.Node,
  routes: Array<RouteDefinition>,
  graph: ModuleGraph,
): RouteDefinition | undefined {
  const variable =
    node.type === AST_NODE_TYPES.Identifier ? findVariable(graph, node) : null
  if (variable === null || !isModuleLevel(variable)) {
    return undefined
  }
  const identity = graph.identify(variable)
  return routes.find(
    (route) =>
      route.identity !== null &&
      route.identity.module === identity.module &&
      route.identity.name === identity.name,
  )
}

/**
 * Reads the route ID of a `getRouteApi('/posts/$postId')` value.
 * @param node - The node that may refer to a route API, e.g. `routeApi` in `routeApi.useParams()`.
 * @param graph - The module graph, used to resolve the variable.
 * @returns The route ID, or `null` if the node isn't a route API with a literal ID.
 */
function getRouteApiId(node: TSESTree.Node, graph: ModuleGraph): string | null {
  let call: TSESTree.Node | null = node
  if (node.type === AST_NODE_TYPES.Identifier) {
    const definition = findVariable(graph, node)?.defs[0]
    call =
      definition?.type === 'Variable' && definition.parent.kind === 'const'
        ? definition.node.init
        : null
  }
  if (
    call?.type !== AST_NODE_TYPES.CallExpression ||
    call.callee.type !== AST_NODE_TYPES.Identifier
  ) {
    return null
  }
  const imported = getImport(graph, call.callee)
  const [id] = call.arguments
  return imported !== null &&
    routerSources.includes(imported.source) &&
    imported.name === 'getRouteApi' &&
    id?.type === AST_NODE_TYPES.Literal &&
    typeof id.value === 'string'
    ? id.value
    : null
}

/**
 * Returns the ID of a route that is known from the route factory call alone.
 * @param node - The call that receives the route options.
 * @param graph - The module graph, used to resolve the route factory's import.
 * @returns The path passed to `createFileRoute`, `__root__` for root routes, or `null` for routes
 * created with `createRoute`, whose ID depends on their parent.
 */
function getRouteId(
  node: TSESTree.CallExpression,
  graph: ModuleGraph,
): string | null {
  const factory =
    node.callee.type === AST_NODE_TYPES.CallExpression
      ? node.callee.callee
      : node.callee
  const name =
    factory.type === AST_NODE_TYPES.Identifier
      ? getImport(graph, factory)?.name
      : undefined

  if (name === 'createRootRoute' || name === 'createRootRouteWithContext') {
    return '__root__'
  }

  const path =
    name === 'createFileRoute' &&
    node.callee.type === AST_NODE_TYPES.CallExpression
      ? node.callee.arguments[0]
      : undefined

  return path?.type === AST_NODE_TYPES.Literal && typeof path.value === 'string'
    ? path.value
    : null
}

/**
 * Checks whether a call creates a route with a TanStack Router route factory.
 * @param node - The call that receives the route options.
 * @param graph - The module graph, used to resolve the factory's import.
 * @returns `true` for `createRoute({ ... })` and `createFileRoute('/')({ ... })` style calls.
 */
function isRouteFactoryCall(
  node: TSESTree.CallExpression,
  graph: ModuleGraph,
): boolean {
  const isRouterImport = (callee: TSESTree.Node, names: Array<string>) => {
    if (callee.type !== AST_NODE_TYPES.Identifier) {
      return false
    }
    const imported = getImport(graph, callee)
    return (
      imported !== null &&
      routerSources.includes(imported.source) &&
      names.includes(imported.name)
    )
  }

  if (isRouterImport(node.callee, routeFactories)) {
    return true
  }

  return (
    node.callee.type === AST_NODE_TYPES.CallExpression &&
    isRouterImport(node.callee.callee, curriedRouteFactories)
  )
}

/**
 * Returns the export a route is assigned to, as in `export const Route = createFileRoute('/')({ ... })`.
 * @param node - The call that creates the route.
 * @param graph - The module graph, used to resolve the variable.
 * @returns The export, or `null` if the route isn't assigned to a module-level variable.
 */
function getAssignedExport(
  node: TSESTree.CallExpression,
  graph: ModuleGraph,
): ModuleExport | null {
  const parent = node.parent

  if (
    parent.type !== AST_NODE_TYPES.VariableDeclarator ||
    parent.id.type !== AST_NODE_TYPES.Identifier
  ) {
    return null
  }

  const variable = findVariable(graph, parent.id)
  return variable && isModuleLevel(variable) ? graph.identify(variable) : null
}

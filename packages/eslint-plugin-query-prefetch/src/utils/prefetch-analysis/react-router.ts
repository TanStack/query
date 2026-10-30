import fs from 'node:fs'
import path from 'node:path'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { ASTUtils } from '../ast-utils'
import {
  findVariable,
  getImport,
  getLazyImport,
  getReturnedExpression,
  getValueProvenance,
  resolveFunctionValue,
  serializeProvenance,
  unwrapComponent,
} from './provenance'
import {
  findHydratedStates,
  getJsxProps,
  resolveJsxComponent,
} from './render-tree'
import type { TSESTree } from '@typescript-eslint/utils'
import type { LoaderCheck } from './checks'
import type { RenderRoot } from './render-tree'
import type { ModuleGraph } from './module-graph'
import type {
  Provenance,
  ProvenanceEnvironment,
  ResolvedFunction,
} from './provenance'

const routerSources = ['react-router', 'react-router-dom']

/** Functions that create a data mode router from route objects. */
const routerFactories = [
  'createBrowserRouter',
  'createHashRouter',
  'createMemoryRouter',
]

const site = "this route's loader"

const params: Provenance = { type: 'binding', name: 'params' }
const request: Provenance = { type: 'binding', name: 'request' }
const context: Provenance = { type: 'binding', name: 'context' }
const search: Provenance = { type: 'binding', name: 'search' }

/** `new URL(request.url)`, whose `searchParams` are the search params `useSearchParams()` returns. */
const requestUrl: Provenance = {
  type: 'operation',
  operator: 'new',
  operands: [
    { type: 'global', name: 'URL' },
    { type: 'member', object: request, property: 'url' },
  ],
}
const requestUrlKey = serializeProvenance(requestUrl)

/** The argument loaders receive. */
const loaderArgs: Provenance = {
  type: 'object',
  open: true,
  properties: [
    ['params', params],
    ['request', request],
    ['context', context],
    ['url', requestUrl],
  ],
}

/**
 * Creates the check for a React Router framework mode route module: the queries its default exported
 * component uses have to be prefetched in its `loader` or `clientLoader`, or in those of its parent
 * routes, which run in parallel.
 * @param graph - The module graph.
 * @returns The environment and the check, or `null` if the file isn't a route module of a React
 * Router framework mode app.
 */
export function getReactRouterFrameworkCheck(
  graph: ModuleGraph,
): { env: ProvenanceEnvironment; check: LoaderCheck } | null {
  if (!graph.projectDependencies().has('@react-router/dev')) {
    return null
  }

  const { path: filePath } = graph.current
  const defaultExport = graph.findExport(filePath, 'default')
  const component = unwrapComponent(defaultExport?.node)
  if (component === null || defaultExport === null) {
    return null
  }

  const own = getRouteModuleLoaders(graph, filePath)
  const appDir = findAppDir(filePath)
  const config = appDir === null ? null : readRouteConfig(graph, appDir)
  const listed = config?.routes.get(filePath)

  const isRouteModule =
    listed !== undefined ||
    own.loader !== null ||
    own.clientLoader !== null ||
    importsRouteTypes(graph) ||
    (config?.complete !== true && isFileRoute(filePath))

  if (!isRouteModule) {
    return null
  }

  const loaderSites = (
    loaders: RouteModuleLoaders,
    route: string,
  ): LoaderCheck['sites'] => [
    ...(loaders.loader
      ? [{ fn: loaders.loader.fn, args: [loaderArgs], server: true, route }]
      : []),
    ...(loaders.clientLoader
      ? [{ fn: loaders.clientLoader.fn, args: [loaderArgs] }]
      : []),
  ]

  // The root route and the parent routes of `routes.ts` render around this route.
  const parents = [
    ...(config?.root !== undefined && config.root !== filePath
      ? [config.root]
      : []),
    ...(listed ?? []),
  ]
  const sites = [
    ...parents.flatMap((parent) =>
      loaderSites(getRouteModuleLoaders(graph, parent), parent),
    ),
    ...loaderSites(own, filePath),
  ]

  const dataLoader = own.clientLoader ?? own.loader
  const env = createReactRouterEnvironment(graph, dataLoader)

  return {
    env,
    check: {
      site,
      sites,
      root: {
        fn: component,
        file: defaultExport.file,
        args: [
          {
            type: 'object',
            open: true,
            properties: [
              ['params', params],
              ['loaderData', getLoaderData(env, dataLoader)],
            ],
          },
        ],
        via: component,
        state: undefined,
      },
      isHydrated: (route) =>
        hydratesRouteState(
          graph,
          route,
          [filePath, ...parents],
          component,
          (id) =>
            id === 'root'
              ? (config?.root ?? null)
              : appDir && findModule(path.join(appDir, id)),
        ),
    },
  }
}

/** The prefix of the bindings that stand for the loader data of a route module. */
const loaderDataPrefix = 'loaderData:'

/**
 * Checks whether the rendered routes render a route's dehydrated state in a `<HydrationBoundary>`. A
 * boundary whose state is read from another route's loader data doesn't count, but one whose state
 * can't be traced to a route, like state merged from `useMatches()`, does.
 * @param graph - The module graph.
 * @param route - The route module whose server loader dehydrates.
 * @param modules - The route module being checked and the route modules that render around it.
 * @param via - The node problems are reported at, in the file being linted.
 * @param resolveRouteId - Finds the route module of a route ID, as passed to `useRouteLoaderData()`.
 * @returns `true` if a boundary may render the route's dehydrated state.
 */
function hydratesRouteState(
  graph: ModuleGraph,
  route: string,
  modules: Array<string>,
  via: TSESTree.Node,
  resolveRouteId: (id: string) => string | null,
): boolean {
  return modules.some((module) => {
    // `loaderData` and `useLoaderData()` give the data of the route module that renders them.
    const loaderData: Provenance = {
      type: 'binding',
      name: loaderDataPrefix + module,
    }
    const env = createLoaderDataEnvironment(graph, loaderData, resolveRouteId)
    return getRouteComponents(graph, module, loaderData, via).some((root) =>
      findHydratedStates(env, root).some((state) => {
        const routes = state && getLoaderDataRoutes(state)
        return !routes || routes.size === 0 || routes.has(route)
      }),
    )
  })
}

/**
 * Creates an environment in which `useLoaderData()` gives a route module's loader data, and
 * `useRouteLoaderData()` with a literal route ID gives the loader data of that route.
 * @param graph - The module graph.
 * @param loaderData - The binding `useLoaderData()` resolves to.
 * @param resolveRouteId - Finds the route module of a route ID.
 * @returns An environment that only resolves these hooks.
 */
function createLoaderDataEnvironment(
  graph: ModuleGraph,
  loaderData: Provenance,
  resolveRouteId: (id: string) => string | null,
): ProvenanceEnvironment {
  return {
    graph,
    parameterBindings: new Map(),
    resolveCall: (node) => {
      if (node.callee.type !== AST_NODE_TYPES.Identifier) {
        return undefined
      }
      const imported = getImport(graph, node.callee)
      if (imported === null || !routerSources.includes(imported.source)) {
        return undefined
      }
      if (imported.name === 'useLoaderData') {
        return loaderData
      }
      if (imported.name === 'useRouteLoaderData') {
        const [id] = node.arguments
        const module =
          id?.type === AST_NODE_TYPES.Literal && typeof id.value === 'string'
            ? resolveRouteId(id.value)
            : null
        return module === null
          ? null
          : { type: 'binding', name: loaderDataPrefix + module }
      }
      return undefined
    },
  }
}

/**
 * Lists the route modules whose loader data a value is read from.
 * @param provenance - The provenance of a hydrated state.
 * @returns The paths of the route modules.
 */
function getLoaderDataRoutes(provenance: Provenance): Set<string> {
  const routes = new Set<string>()
  const visit = (current: Provenance | null) => {
    switch (current?.type) {
      case 'binding':
        if (current.name.startsWith(loaderDataPrefix)) {
          routes.add(current.name.slice(loaderDataPrefix.length))
        }
        break
      case 'member':
        visit(current.object)
        break
      case 'call':
        visit(current.callee)
        current.args.forEach(visit)
        break
      case 'object':
        current.properties.forEach(([, value]) => visit(value))
        break
      case 'operation':
        current.operands.forEach(visit)
        break
      default:
        break
    }
  }
  visit(provenance)
  return routes
}

/**
 * Finds the components a route module renders: its default export, and the `Layout` export of the
 * root route.
 * @param graph - The module graph.
 * @param module - The route module's path.
 * @param loaderData - The value of the components' `loaderData` prop.
 * @param via - The node problems are reported at, in the file being linted.
 * @returns The components, to walk from.
 */
function getRouteComponents(
  graph: ModuleGraph,
  module: string,
  loaderData: Provenance,
  via: TSESTree.Node,
): Array<RenderRoot<undefined>> {
  const props: Provenance = {
    type: 'object',
    open: true,
    properties: [['loaderData', loaderData]],
  }
  return ['default', 'Layout'].flatMap((name) => {
    const found = graph.findExport(module, name)
    const fn = unwrapComponent(found?.node)
    return fn && found
      ? [{ fn, file: found.file, args: [props], via, state: undefined }]
      : []
  })
}

/**
 * Checks whether a call creates a React Router data mode router, like `createBrowserRouter(routes)`.
 * @param node - The call to check.
 * @param graph - The module graph, used to resolve the callee's import.
 * @returns `true` for the router factories of React Router.
 */
export function isDataRouterCall(
  node: TSESTree.CallExpression,
  graph: ModuleGraph,
): boolean {
  if (node.callee.type !== AST_NODE_TYPES.Identifier) {
    return false
  }
  const imported = getImport(graph, node.callee)
  return (
    imported !== null &&
    routerSources.includes(imported.source) &&
    routerFactories.includes(imported.name)
  )
}

/**
 * Creates the checks for the routes of a React Router data mode router: the queries each route's
 * component uses have to be prefetched by its `loader` or the loader of a parent route, which run in
 * parallel when the route is navigated to.
 * @param graph - The module graph.
 * @param node - The `createBrowserRouter(routes)` call.
 * @returns The checks, each with its environment.
 */
export function getReactRouterDataChecks(
  graph: ModuleGraph,
  node: TSESTree.CallExpression,
): Array<{ env: ProvenanceEnvironment; check: LoaderCheck }> {
  const checks: Array<{ env: ProvenanceEnvironment; check: LoaderCheck }> = []
  const [routesArgument] = node.arguments
  // Routes declared in another file are reported at the routes passed to the router.
  const viaInFile = (via: TSESTree.Node) =>
    graph.fileOf(via) === graph.current ? via : (routesArgument ?? node)

  const visitRoutes = (
    routes: TSESTree.Node | undefined,
    parentSites: LoaderCheck['sites'],
  ) => {
    const array = resolveArray(graph, routes)
    for (const route of array?.elements ?? []) {
      if (route?.type !== AST_NODE_TYPES.ObjectExpression) {
        continue
      }
      const option = (key: string) =>
        ASTUtils.findPropertyWithIdentifierKey(route.properties, key)?.value

      const loaderNode = option('loader')
      const lazyNode = option('lazy')
      const lazyModule = lazyNode
        ? (getLazyImport(graph, lazyNode)?.module ?? null)
        : null
      const loader = loaderNode
        ? resolveFunctionValue(graph, loaderNode)
        : lazyModule
          ? getRouteModuleLoaders(graph, lazyModule).loader
          : null
      const sites = loader
        ? [...parentSites, { fn: loader.fn, args: [loaderArgs] }]
        : parentSites
      const env = createReactRouterEnvironment(graph, loader)

      const roots: Array<LoaderCheck['root']> = []
      const componentNode = option('Component')
      const element = option('element')

      if (componentNode !== undefined) {
        const component = resolveFunctionValue(graph, componentNode)
        if (component !== null) {
          roots.push({
            ...component,
            args: [],
            via: viaInFile(componentNode),
            state: undefined,
          })
        }
      } else if (element?.type === AST_NODE_TYPES.JSXElement) {
        for (const rendered of findRenderedComponents(env, element)) {
          roots.push({
            ...rendered.component,
            args: [getJsxProps(rendered.element, env)],
            via: viaInFile(rendered.element.openingElement),
            state: undefined,
          })
        }
      } else if (lazyModule !== null && lazyNode !== undefined) {
        const found = graph.findExport(lazyModule, 'Component')
        const component = unwrapComponent(found?.node)
        if (component !== null && found !== null) {
          roots.push({
            fn: component,
            file: found.file,
            args: [],
            via: viaInFile(lazyNode),
            state: undefined,
          })
        }
      }

      for (const root of roots) {
        checks.push({ env, check: { site, sites, root } })
      }

      visitRoutes(option('children'), sites)
    }
  }

  visitRoutes(routesArgument, [])
  return checks
}

interface RouteModuleLoaders {
  /** The server `loader`. */
  loader: ResolvedFunction | null
  /** The `clientLoader`. */
  clientLoader: ResolvedFunction | null
}

/**
 * Reads the `loader` and `clientLoader` a route module exports.
 * @param graph - The module graph, used to load the route module.
 * @param module - The route module's path or module ID.
 * @returns The loaders, `null` for the ones the module doesn't export.
 */
function getRouteModuleLoaders(
  graph: ModuleGraph,
  module: string,
): RouteModuleLoaders {
  const get = (name: string) => {
    const found = graph.findExport(module, name)
    return found ? resolveFunctionValue(graph, found.node) : null
  }
  return { loader: get('loader'), clientLoader: get('clientLoader') }
}

/**
 * Finds the components an `element` renders: the element's own component, or the components inside
 * wrappers that can't be followed, like `<Suspense>` or an error boundary from a package.
 * @param env - The routing environment.
 * @param element - The `element` JSX.
 * @returns The components and the elements that render them.
 */
function findRenderedComponents(
  env: ProvenanceEnvironment,
  element: TSESTree.JSXElement,
): Array<{ element: TSESTree.JSXElement; component: ResolvedFunction }> {
  const component = resolveJsxComponent(element.openingElement, env)
  if (component !== null) {
    return [{ element, component }]
  }
  return element.children.flatMap((child) => {
    const nested =
      child.type === AST_NODE_TYPES.JSXExpressionContainer
        ? child.expression
        : child
    return nested.type === AST_NODE_TYPES.JSXElement
      ? findRenderedComponents(env, nested)
      : []
  })
}

interface RouteConfig {
  /** The root route module, which renders around every route. */
  root: string | undefined
  /** The route modules of `routes.ts`, with their parent route modules, outermost first. */
  routes: Map<string, Array<string>>
  /** Whether every route of `routes.ts` could be read, so files it doesn't list aren't routes. */
  complete: boolean
}

/**
 * Reads the routes of a framework mode app from `app/routes.ts`, as declared with `route()`,
 * `index()`, `layout()`, and `prefix()` from `@react-router/dev/routes`.
 * @param graph - The module graph, used to parse `routes.ts`.
 * @param appDir - The app directory, which contains `root.tsx` and `routes.ts`.
 * @returns The root route module and the route modules with their parents.
 */
function readRouteConfig(graph: ModuleGraph, appDir: string): RouteConfig {
  const config: RouteConfig = {
    root: findModule(path.join(appDir, 'root')) ?? undefined,
    routes: new Map(),
    complete: false,
  }
  const routesFile = findModule(path.join(appDir, 'routes'))
  const found = routesFile ? graph.findExport(routesFile, 'default') : null
  if (found === null) {
    return config
  }

  let complete = true
  const visit = (node: TSESTree.Node, parents: Array<string>) => {
    const array = unwrapExpression(node)
    if (array.type !== AST_NODE_TYPES.ArrayExpression) {
      complete = false
      return
    }
    for (const element of array.elements) {
      const entry =
        element?.type === AST_NODE_TYPES.SpreadElement
          ? element.argument
          : element
      if (
        entry?.type !== AST_NODE_TYPES.CallExpression ||
        entry.callee.type !== AST_NODE_TYPES.Identifier
      ) {
        complete = false
        continue
      }
      const name = getImport(graph, entry.callee)?.name ?? entry.callee.name
      const args = entry.arguments
      const fileArgument = { route: 1, index: 0, layout: 0 }[name]
      const file = fileArgument === undefined ? undefined : args[fileArgument]
      let current = parents
      if (
        file?.type === AST_NODE_TYPES.Literal &&
        typeof file.value === 'string'
      ) {
        const routeFile = path.resolve(appDir, file.value)
        config.routes.set(routeFile, parents)
        current = [...parents, routeFile]
      } else if (name !== 'prefix') {
        complete = false
        continue
      }
      const children = [...args]
        .reverse()
        .find(
          (arg) =>
            unwrapExpression(arg).type === AST_NODE_TYPES.ArrayExpression,
        )
      if (children !== undefined) {
        visit(children, current)
      }
    }
  }
  visit(found.node, [])
  config.complete = complete
  return config
}

/**
 * Finds the file of a module path without its extension, like a route ID relative to the app
 * directory.
 * @param base - The absolute path without an extension.
 * @returns The file's path, or `null` if no file has one of the script extensions.
 */
function findModule(base: string): string | null {
  return (
    ['.tsx', '.ts', '.jsx', '.js']
      .map((extension) => base + extension)
      .find((file) => fs.existsSync(file)) ?? null
  )
}

/**
 * Finds the app directory of a framework mode app, which contains its `root` route module.
 * @param file - The path of a file of the app.
 * @returns The app directory, or `null` if none is found.
 */
function findAppDir(file: string): string | null {
  for (let dir = path.dirname(file); ; dir = path.dirname(dir)) {
    if (
      ['root.tsx', 'root.jsx', 'root.ts', 'root.js', 'routes.ts'].some((name) =>
        fs.existsSync(path.join(dir, name)),
      )
    ) {
      return dir
    }
    if (
      fs.existsSync(path.join(dir, 'package.json')) ||
      path.dirname(dir) === dir
    ) {
      return null
    }
  }
}

/**
 * Checks whether a file is a route module by the conventions of `@react-router/fs-routes`: a file
 * directly in `app/routes`, or a `route` file in a folder of `app/routes`.
 * @param file - The file's path.
 * @returns `true` if the file's path makes it a route module.
 */
function isFileRoute(file: string): boolean {
  const parts = file.split(path.sep)
  const index = parts.lastIndexOf('routes')
  if (index < 1 || parts[index - 1] !== 'app') {
    return false
  }
  const rest = parts.slice(index + 1)
  return (
    rest.length === 1 ||
    (rest.length === 2 && /^route\.[cm]?[jt]sx?$/.test(rest[1]!))
  )
}

/**
 * Creates the provenance environment of a React Router route: `useParams()`, `useSearchParams()`, and
 * `useLoaderData()` in components, and the `params` and `request` loaders receive.
 * @param graph - The module graph.
 * @param loader - The loader whose returned value `useLoaderData()` gives.
 * @returns The environment, shared by the route's loaders and component.
 */
function createReactRouterEnvironment(
  graph: ModuleGraph,
  loader: ResolvedFunction | null,
): ProvenanceEnvironment {
  const env: ProvenanceEnvironment = {
    graph,
    parameterBindings: new Map(),
    resolveCall: (node) => {
      if (node.callee.type !== AST_NODE_TYPES.Identifier) {
        return undefined
      }
      const imported = getImport(graph, node.callee)
      if (imported === null || !routerSources.includes(imported.source)) {
        return undefined
      }
      switch (imported.name) {
        case 'useParams':
          return params
        case 'useSearchParams':
          return { type: 'object', open: true, properties: [['0', search]] }
        case 'useLoaderData':
          return getLoaderData(env, loader)
        default:
          return undefined
      }
    },
    // `new URL(request.url).searchParams` holds the same values as `useSearchParams()`.
    normalize: (provenance) =>
      provenance.type === 'member' &&
      provenance.property === 'searchParams' &&
      serializeProvenance(provenance.object) === requestUrlKey
        ? search
        : undefined,
  }
  return env
}

/**
 * Returns the value a loader returns, which components read with `useLoaderData()` or the
 * `loaderData` prop.
 * @param env - The routing environment.
 * @param loader - The `loader` or `clientLoader` the component's data comes from.
 * @returns The provenance of the returned value, or `null` if it can't be tracked.
 */
function getLoaderData(
  env: ProvenanceEnvironment,
  loader: ResolvedFunction | null,
): Provenance | null {
  const returned = loader && getReturnedExpression(loader.fn)
  if (!loader || !returned) {
    return null
  }
  env.parameterBindings.set(loader.fn, [loaderArgs])
  return getValueProvenance(returned, env)
}

/**
 * Checks whether the file imports the types React Router generates for route modules, as in
 * `import type { Route } from './+types/post'`.
 * @param graph - The module graph.
 * @returns `true` if the file imports from a `./+types/` module.
 */
function importsRouteTypes(graph: ModuleGraph): boolean {
  return graph.current.source.ast.body.some(
    (statement) =>
      statement.type === AST_NODE_TYPES.ImportDeclaration &&
      statement.source.value.startsWith('./+types/'),
  )
}

/**
 * Returns the array of route objects passed to a router, following `const`s and imports, and
 * unwrapping `as` and `satisfies`.
 * @param graph - The module graph.
 * @param node - The routes argument.
 * @returns The array, or `null` if it isn't an array literal.
 */
function resolveArray(
  graph: ModuleGraph,
  node: TSESTree.Node | undefined,
): TSESTree.ArrayExpression | null {
  const value = node && unwrapExpression(node)
  if (value?.type === AST_NODE_TYPES.ArrayExpression) {
    return value
  }
  if (value?.type !== AST_NODE_TYPES.Identifier) {
    return null
  }
  const variable = findVariable(graph, value)
  const definition = variable?.defs[0]
  if (definition?.type === 'Variable' && definition.node.init !== null) {
    return resolveArray(graph, definition.node.init)
  }
  if (variable && definition?.type === 'ImportBinding') {
    const exported = graph.identify(variable)
    return resolveArray(
      graph,
      graph.findExport(exported.module, exported.name)?.node,
    )
  }
  return null
}

/**
 * Removes `as`, `satisfies`, and non-null assertions around an expression.
 * @param node - The expression that may be wrapped in assertions.
 * @returns The expression inside the assertions.
 */
function unwrapExpression(node: TSESTree.Node): TSESTree.Node {
  while (
    node.type === AST_NODE_TYPES.TSAsExpression ||
    node.type === AST_NODE_TYPES.TSSatisfiesExpression ||
    node.type === AST_NODE_TYPES.TSNonNullExpression
  ) {
    node = node.expression
  }
  return node
}

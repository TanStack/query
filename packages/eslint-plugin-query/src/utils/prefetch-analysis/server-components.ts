import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { descend, getOwnPrefetches, getRelativePath } from './checks'
import { unwrapComponent, walk } from './provenance'
import {
  collectPrefetches,
  getJsxProps,
  isInsideHydrationBoundary,
  resolveJsxComponent,
  withBindings,
} from './render-tree'
import type { TSESTree } from '@typescript-eslint/utils'
import type { ServerCheck, ServerState } from './checks'
import type { ModuleGraph } from './module-graph'
import type {
  FunctionNode,
  Provenance,
  ProvenanceEnvironment,
  ResolvedFunction,
} from './provenance'

/**
 * A page or layout file of a framework with server components.
 */
export interface ServerEntry {
  /** Where the prefetch belongs, used in messages, e.g. `this page`. */
  site: string
  /** The props the entry's component receives. */
  props: Provenance
  /**
   * The layouts that render the entry, outermost first, with the props they receive. Their
   * prefetches count for the entry if they render `children` inside a `<HydrationBoundary>`, in
   * their own JSX or in a component they pass `children` to.
   */
  layouts: Array<{ path: string; props: Provenance }>
}

/**
 * Creates the check for a page or layout file of a framework with server components.
 * @param env - The routing environment.
 * @param entry - The entry's site, props, and layouts.
 * @param loosen - Rewrites values that are almost the same on the server and the client.
 * @returns The check, or `null` if the file doesn't default export a component.
 */
export function createServerCheck(
  env: ProvenanceEnvironment,
  entry: ServerEntry,
  loosen?: ServerCheck['loosen'],
): ServerCheck | null {
  const { graph } = env
  if (graph.current.directive === 'use client') {
    return null
  }
  const component = getDefaultExportedComponent(graph, graph.current.path)
  if (component === null) {
    return null
  }

  let prefetched: ServerState['prefetched'] = new Map()
  for (const layout of entry.layouts) {
    if (layout.path === graph.current.path) {
      continue
    }
    const layoutComponent = getDefaultExportedComponent(graph, layout.path)
    if (layoutComponent === null || layoutComponent.file.directive !== null) {
      continue
    }
    for (const step of getChildrenPath(env, layoutComponent.fn, [
      layout.props,
    ])) {
      const own = getOwnPrefetches(
        collectPrefetches(env, step.fn, step.args),
        `'${getRelativePath(graph, graph.fileOf(step.fn).path)}'`,
        loosen,
      )
      prefetched = descend(prefetched, own, step.hydrated)
    }
  }

  return {
    site: entry.site,
    loosen,
    root: {
      fn: component.fn,
      file: component.file,
      args: [entry.props],
      via: component.fn,
      state: { side: 'server', prefetched },
    },
  }
}

/**
 * Finds the component a file default exports.
 * @param graph - The module graph.
 * @param filePath - The file's absolute path.
 * @returns The component and its file, or `null` if the file doesn't default export a function.
 */
function getDefaultExportedComponent(
  graph: ModuleGraph,
  filePath: string,
): ResolvedFunction | null {
  const found = graph.findExport(filePath, 'default')
  const fn = unwrapComponent(found?.node)
  return fn && found ? { fn, file: found.file } : null
}

/** How many components a layout's `children` are followed through. */
const maxWrapperDepth = 10

/**
 * A server component a layout's `children` are rendered through.
 */
interface ChildrenStep {
  /** The component: the layout, or a component the layout passes `children` to. */
  fn: FunctionNode
  /** The values the component's parameters receive. */
  args: Array<Provenance | null>
  /** Whether the component renders the `children` inside a `<HydrationBoundary>`. */
  hydrated: boolean
}

/**
 * Lists the server components a layout's `children` are rendered through, outermost first: the
 * layout, then the components it passes them to, like `<AppShell>{children}</AppShell>`, whose
 * prefetches and `<HydrationBoundary>` count for the pages below too.
 * @param env - The routing environment.
 * @param fn - The layout, or a component the layout's `children` are passed to.
 * @param args - The values the component's parameters receive.
 * @param seen - The components already followed, to stop on cycles.
 * @returns The components, or an empty array if `fn` doesn't render `children`.
 */
function getChildrenPath(
  env: ProvenanceEnvironment,
  fn: FunctionNode,
  args: Array<Provenance | null>,
  seen = new Set<FunctionNode>(),
): Array<ChildrenStep> {
  if (seen.has(fn) || seen.size > maxWrapperDepth) {
    return []
  }
  seen.add(fn)
  const children = findChildren(env.graph, fn)
  if (children === null) {
    return []
  }
  const path: Array<ChildrenStep> = [
    { fn, args, hydrated: isInsideHydrationBoundary(env, children, fn) },
  ]

  withBindings(env, fn, args, () => {
    // The components that receive the `children`, as JSX children or as a `children` prop,
    // innermost first.
    const wrappers: Array<TSESTree.JSXElement> = []
    let previous: TSESTree.Node = children
    for (
      let current: TSESTree.Node | undefined = children.parent;
      current !== undefined && current !== fn;
      previous = current, current = current.parent
    ) {
      if (
        current.type === AST_NODE_TYPES.JSXElement &&
        (current.children.includes(previous as TSESTree.JSXChild) ||
          (previous === current.openingElement &&
            isChildrenAttribute(children, current.openingElement)))
      ) {
        wrappers.unshift(current)
      }
    }
    for (const wrapper of wrappers) {
      const component = resolveJsxComponent(wrapper.openingElement, env)
      if (component === null || component.file.directive !== null) {
        continue
      }
      path.push(
        ...getChildrenPath(
          env,
          component.fn,
          [getJsxProps(wrapper, env)],
          seen,
        ),
      )
    }
  })
  return path
}

/**
 * Checks whether a node is the value of an element's `children` attribute, as in
 * `<AppShell children={children} />`.
 * @param node - The layout's `{children}` expression.
 * @param element - The opening element.
 * @returns `true` if the node is inside the element's `children` attribute.
 */
function isChildrenAttribute(
  node: TSESTree.Node,
  element: TSESTree.JSXOpeningElement,
): boolean {
  return element.attributes.some(
    (attribute) =>
      attribute.type === AST_NODE_TYPES.JSXAttribute &&
      attribute.name.type === AST_NODE_TYPES.JSXIdentifier &&
      attribute.name.name === 'children' &&
      node.range[0] >= attribute.range[0] &&
      node.range[1] <= attribute.range[1],
  )
}

/**
 * Finds where a layout renders its `children`.
 * @param graph - The module graph.
 * @param fn - The layout component.
 * @returns The `{children}` expression, or `null` if the layout doesn't render it.
 */
function findChildren(
  graph: ModuleGraph,
  fn: FunctionNode,
): TSESTree.Node | null {
  let found: TSESTree.Node | null = null
  walk(graph, fn.body, (node) => {
    if (
      found === null &&
      node.type === AST_NODE_TYPES.JSXExpressionContainer &&
      ((node.expression.type === AST_NODE_TYPES.Identifier &&
        node.expression.name === 'children') ||
        (node.expression.type === AST_NODE_TYPES.MemberExpression &&
          node.expression.property.type === AST_NODE_TYPES.Identifier &&
          node.expression.property.name === 'children'))
    ) {
      found = node
    }
    return found === null
  })
  return found
}

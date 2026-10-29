import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { descend, getOwnPrefetches, getRelativePath } from './checks'
import { unwrapComponent, walk } from './provenance'
import { collectPrefetches, isInsideHydrationBoundary } from './render-tree'
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
   * prefetches count for the entry if they render `children` inside a `<HydrationBoundary>`.
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
    const own = getOwnPrefetches(
      collectPrefetches(env, layoutComponent.fn, [layout.props]),
      `'${getRelativePath(graph, layout.path)}'`,
      loosen,
    )
    const children = findChildren(graph, layoutComponent.fn)
    prefetched = descend(
      prefetched,
      own,
      children !== null &&
        isInsideHydrationBoundary(env, children, layoutComponent.fn),
    )
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

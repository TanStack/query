import path from 'node:path'
import { serializeProvenance } from './provenance'
import {
  callsDehydrate,
  collectPrefetches,
  isInsideHydrationBoundary,
  queryHooks,
  walkRenderTree,
} from './render-tree'
import type { TSESTree } from '@typescript-eslint/utils'
import type { ModuleGraph } from './module-graph'
import type {
  FunctionNode,
  Provenance,
  ProvenanceEnvironment,
} from './provenance'
import type { QueryOptionsSource } from './query-options'
import type {
  Prefetch,
  QueryUsage,
  RenderFrame,
  RenderRoot,
} from './render-tree'

/**
 * The messages the checks report.
 */
type MessageId =
  | 'missingPrefetch'
  | 'inlineQueryOptions'
  | 'notDehydrated'
  | 'loaderNotDehydrated'
  | 'clientQueryOptions'
  | 'searchParamsMismatch'

/**
 * A problem found by a check, in the file being linted.
 */
export interface Report {
  /** The node to report, in the file being linted. */
  node: TSESTree.Node
  /** The message to report. */
  messageId: MessageId
  /** The values of the message's placeholders. */
  data: Record<string, string>
}

/**
 * A route whose loaders run before its component renders, as with TanStack Router and React Router:
 * the queries the component uses have to be prefetched in one of the loaders.
 */
export interface LoaderCheck {
  /** Where the prefetch belongs, used in messages, e.g. `this route's loader`. */
  site: string
  /** The functions that run before render and can prefetch, with the values they receive. */
  sites: Array<{
    fn: FunctionNode
    args: Array<Provenance | null>
    /**
     * Whether the function runs on the server, so its prefetches only reach the client if it
     * dehydrates the query client.
     */
    server?: boolean
  }>
  /** The route's component. */
  root: RenderRoot<undefined>
}

/**
 * The state of a server component tree walk.
 */
export interface ServerState {
  /** Whether the current function runs on the server or is a client component. */
  side: 'server' | 'client'
  /**
   * The queries prefetched by the server components above the current function, and whether they
   * are dehydrated into a `<HydrationBoundary>` that encloses it.
   */
  prefetched: Map<string, PrefetchedQuery>
}

interface PrefetchedQuery extends OwnPrefetch {
  /** Whether the query is dehydrated into a `<HydrationBoundary>` that encloses the current function. */
  hydrated: boolean
}

/**
 * A page or layout rendered by server components, as with the Next.js App Router and Waku: the
 * queries its client components use have to be prefetched by a server component above them and
 * dehydrated into a `<HydrationBoundary>`.
 */
export interface ServerCheck {
  /** Where the prefetch belongs, used in messages, e.g. `this page`. */
  site: string
  /** The page or layout component. */
  root: RenderRoot<ServerState>
  /**
   * Rewrites values that are almost the same on the server and the client, like a search param read
   * from `searchParams` and from `useSearchParams()`, to report a dedicated message when they are
   * the only difference.
   */
  loosen?: (provenance: Provenance) => Provenance
}

/**
 * Checks that the queries a route's component uses are prefetched by the route's loaders.
 * @param env - The routing environment.
 * @param check - The route.
 * @param report - Called with each problem found in the file being linted.
 */
export function runLoaderCheck(
  env: ProvenanceEnvironment,
  check: LoaderCheck,
  report: (report: Report) => void,
): void {
  const prefetched = new Map<string, { dehydrated: boolean }>()

  for (const site of check.sites) {
    const dehydrated = site.server ? callsDehydrate(env, site.fn) : true
    for (const prefetch of collectPrefetches(env, site.fn, site.args)) {
      const key = getQueryKey(prefetch.source)
      if (key !== null) {
        const previous = prefetched.get(key.key)
        prefetched.set(key.key, {
          dehydrated: dehydrated || previous?.dehydrated === true,
        })
      }
    }
  }

  walkRenderTree(env, check.root, {
    query: (usage, frame) => {
      const target = getReportTarget(env.graph, frame, usage.options)
      const data = getMessageData(env.graph, usage, check.site)
      const key = getQueryKey(usage.source)
      const found = key && prefetched.get(key.key)

      if (found) {
        if (!found.dehydrated) {
          report({ node: target, messageId: 'loaderNotDehydrated', data })
        }
      } else if (usage.source.type === 'tracked') {
        report({ node: target, messageId: 'missingPrefetch', data })
      } else if (usage.source.type === 'inline' && usage.source.hoistable) {
        report({ node: target, messageId: 'inlineQueryOptions', data })
      }
    },
  })
}

/**
 * Checks that the queries the client components of a page or layout use are prefetched by the
 * server components above them, and dehydrated into a `<HydrationBoundary>`.
 * @param env - The routing environment.
 * @param check - The page or layout.
 * @param report - Called with each problem found in the file being linted.
 */
export function runServerCheck(
  env: ProvenanceEnvironment,
  check: ServerCheck,
  report: (report: Report) => void,
): void {
  // The queries prefetched by each server component, until its children are visited.
  const ownPrefetches = new Map<FunctionNode, Map<string, OwnPrefetch>>()

  walkRenderTree(env, check.root, {
    enter: (frame) => {
      if (frame.state.side === 'server') {
        const prefetches = collectPrefetches(
          env,
          frame.fn,
          env.parameterBindings.get(frame.fn) ?? [],
        )
        for (const prefetch of prefetches) {
          checkServerPrefetch(env, prefetch, frame, report)
        }
        ownPrefetches.set(
          frame.fn,
          getOwnPrefetches(prefetches, check.site, check.loosen),
        )
      }
      return frame.state
    },
    child: (frame, child): ServerState | null => {
      if (frame.state.side === 'client') {
        return frame.state
      }
      // Server components can't call hooks.
      if (child.kind === 'hook') {
        return null
      }
      return {
        side: child.file.directive === 'use client' ? 'client' : 'server',
        prefetched: descend(
          frame.state.prefetched,
          ownPrefetches.get(frame.fn) ?? new Map(),
          isInsideHydrationBoundary(env, child.via, frame.fn),
        ),
      }
    },
    query: (usage, frame) => {
      if (frame.state.side !== 'client') {
        return
      }
      const target = getReportTarget(env.graph, frame, usage.options)
      const data = getMessageData(env.graph, usage, check.site)
      const key = getQueryKey(usage.source, check.loosen)

      const found = key && frame.state.prefetched.get(key.key)
      if (found) {
        if (!found.hydrated) {
          report({
            node: target,
            messageId: 'notDehydrated',
            data: { ...data, site: found.site },
          })
        }
        return
      }

      if (usage.source.type === 'inline') {
        if (usage.source.hoistable) {
          report({ node: target, messageId: 'inlineQueryOptions', data })
        }
        return
      }
      if (key === null) {
        return
      }

      const almost = [...frame.state.prefetched.values()].some(
        (prefetched) => prefetched.loose === key.loose,
      )
      report({
        node: target,
        messageId: almost ? 'searchParamsMismatch' : 'missingPrefetch',
        data,
      })
    },
  })
}

/**
 * A query a server component prefetches.
 */
interface OwnPrefetch {
  /** The key the query is compared by when values are almost the same, see `ServerCheck#loosen`. */
  loose: string
  /** Where the query is prefetched, for messages. */
  site: string
}

/**
 * Returns the key a query is compared by: the serialized provenance of its options, or of its
 * `queryKey` for options written inline.
 * @param source - What the query options were built from.
 * @param loosen - Rewrites values that are almost the same on the server and the client.
 * @returns The key and the loose key, or `null` if the options can't be compared.
 */
function getQueryKey(
  source: QueryOptionsSource,
  loosen?: (provenance: Provenance) => Provenance,
): { key: string; loose: string } | null {
  const serialize = (prefix: string, provenance: Provenance) => ({
    key: prefix + serializeProvenance(provenance),
    loose: prefix + serializeProvenance(loosen?.(provenance) ?? provenance),
  })
  if (source.type === 'tracked') {
    return serialize('', source.provenance)
  }
  if (source.type === 'inline' && source.queryKey !== null) {
    return serialize('queryKey:', source.queryKey)
  }
  return null
}

/**
 * Builds the prefetched queries for the children of a server component that are rendered through a
 * given node.
 * @param inherited - The queries prefetched above the server component.
 * @param own - The queries the server component prefetches.
 * @param hydrated - Whether the node is inside a `<HydrationBoundary>` of the server component.
 * @returns The prefetched queries for the children.
 */
export function descend(
  inherited: Map<string, PrefetchedQuery>,
  own: Map<string, OwnPrefetch>,
  hydrated: boolean,
): Map<string, PrefetchedQuery> {
  const result = new Map<string, PrefetchedQuery>()
  for (const [key, query] of inherited) {
    // A boundary further down can still dehydrate a query prefetched above, when the server
    // components share a query client.
    result.set(key, { ...query, hydrated: query.hydrated || hydrated })
  }
  for (const [key, prefetch] of own) {
    result.set(key, {
      ...prefetch,
      hydrated: hydrated || result.get(key)?.hydrated === true,
    })
  }
  return result
}

/**
 * Collects the queries a server component prefetches, by the key they are compared by.
 * @param prefetches - The server component's prefetch calls.
 * @param site - Where the server component is, for messages, e.g. `this page`.
 * @param loosen - Rewrites values that are almost the same on the server and the client.
 * @returns The prefetched queries.
 */
export function getOwnPrefetches(
  prefetches: Array<Prefetch>,
  site: string,
  loosen: ((provenance: Provenance) => Provenance) | undefined,
): Map<string, OwnPrefetch> {
  const own = new Map<string, OwnPrefetch>()
  for (const prefetch of prefetches) {
    const key = getQueryKey(prefetch.source, loosen)
    if (key !== null) {
      own.set(key.key, { loose: key.loose, site })
    }
  }
  return own
}

/**
 * Reports a prefetch in a server component whose options come from a `'use client'` module, which
 * are client references on the server.
 * @param env - The routing environment.
 * @param prefetch - The `queryClient.query()` or similar call.
 * @param frame - The frame of the server component that makes the call.
 * @param report - Called with the problem.
 */
function checkServerPrefetch(
  env: ProvenanceEnvironment,
  prefetch: Prefetch,
  frame: RenderFrame<ServerState>,
  report: (report: Report) => void,
): void {
  if (prefetch.source.type !== 'tracked') {
    return
  }
  const factory = getFactory(prefetch.source.provenance)
  if (factory === null || !env.graph.isClientModule(factory.module)) {
    return
  }
  report({
    node: getReportTarget(env.graph, frame, prefetch.options),
    messageId: 'clientQueryOptions',
    data: {
      name: factory.name,
      file: getRelativePath(env.graph, factory.module),
    },
  })
}

/**
 * Returns the module-level value query options are built from, e.g. `postOptions` in
 * `postOptions(id)` or `queries.post(id)`.
 * @param provenance - The provenance of the query options.
 * @returns The module and name of the value, or `null` if the options aren't built from one.
 */
function getFactory(
  provenance: Provenance,
): { module: string; name: string } | null {
  let current = provenance
  for (;;) {
    if (current.type === 'call') {
      current = current.callee
    } else if (current.type === 'member') {
      current = current.object
    } else {
      return current.type === 'static' ? current : null
    }
  }
}

/**
 * Finds the node to report a problem at in the file being linted: the node itself if it is in that
 * file, or the JSX element, hook call, or route option that leads to the file that contains it.
 * @param graph - The module graph.
 * @param frame - The frame of the function that contains the node.
 * @param node - The node the problem is about.
 * @returns The node to report.
 */
function getReportTarget<TState>(
  graph: ModuleGraph,
  frame: RenderFrame<TState>,
  node: TSESTree.Node,
): TSESTree.Node {
  if (graph.fileOf(node) === graph.current) {
    return node
  }
  for (
    let current: RenderFrame<TState> | null = frame;
    current !== null;
    current = current.parent
  ) {
    if (graph.fileOf(current.via) === graph.current) {
      return current.via
    }
  }
  return frame.via
}

/**
 * Builds the data of the messages about a query hook call.
 * @param graph - The module graph, used to find the file of the call.
 * @param usage - The `useQuery()` or similar call.
 * @param site - Where the prefetch belongs.
 * @returns The values of the placeholders of the messages: the hook, the options, where they are, and the site.
 */
function getMessageData(
  graph: ModuleGraph,
  usage: QueryUsage,
  site: string,
): Record<string, string> {
  const file = graph.fileOf(usage.options)
  return {
    hook: usage.hook,
    method: queryHooks[usage.hook] ?? 'query',
    options: file.source.getText(usage.options),
    location:
      file === graph.current
        ? ''
        : ` in '${getRelativePath(graph, file.path)}'`,
    site,
  }
}

/**
 * Returns a path relative to the directory of the file being linted, for messages.
 * @param graph - The module graph.
 * @param filePath - The path to shorten.
 * @returns The relative path, starting with `./` or `../`.
 */
export function getRelativePath(graph: ModuleGraph, filePath: string): string {
  if (!path.isAbsolute(filePath)) {
    return filePath
  }
  const relative = path
    .relative(path.dirname(graph.current.path), filePath)
    .split(path.sep)
    .join('/')
  return relative.startsWith('.') ? relative : `./${relative}`
}

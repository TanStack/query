import path from 'node:path'
import {
  findOutermostDir,
  findWithExtension,
  getDirsFrom,
  moduleExtensions,
} from './files'
import { getImportedName } from './provenance'
import { createServerCheck } from './server-components'
import type { ServerCheck } from './checks'
import type { ModuleGraph } from './module-graph'
import type { Provenance, ProvenanceEnvironment } from './provenance'

const routerSources = ['waku', 'waku/router/client']

/** The props of pages and layouts: the route's slugs, and the `path` and `query` of pages. */
const routeProps: Provenance = { type: 'binding', name: 'route' }

/** Directories of `src/pages` that don't contain pages. */
const ignoredDirectories = ['_api', '_components', '_hooks', '_actions']

/**
 * Creates the check for a page or layout of a Waku app: the queries its client components use have
 * to be prefetched by a server component above them and dehydrated into a `<HydrationBoundary>`.
 * @param graph - The module graph.
 * @returns The environment and the check, or `null` if the file isn't a page or layout of a Waku
 * app.
 */
export function getWakuCheck(
  graph: ModuleGraph,
): { env: ProvenanceEnvironment; check: ServerCheck } | null {
  const file = graph.current.path
  const pagesDir = findOutermostDir(file, 'pages')
  if (pagesDir === null || !graph.projectDependencies().has('waku')) {
    return null
  }

  const relative = path.relative(pagesDir, file).split(path.sep)
  const name = path.basename(file).replace(/\.[cm]?[jt]sx?$/, '')
  if (
    relative.some((part) => ignoredDirectories.includes(part)) ||
    (name.startsWith('_') && name !== '_layout' && name !== '_root')
  ) {
    return null
  }

  // Slices are rendered on their own with `<Slice id="..." />`, outside of the layouts.
  const isSlice = relative[0] === '_slices'
  const env = createWakuEnvironment(graph)
  const check = createServerCheck(env, {
    site: isSlice
      ? 'this slice'
      : name === '_layout' || name === '_root'
        ? 'this layout'
        : 'this page',
    props: routeProps,
    layouts: isSlice
      ? []
      : findLayouts(pagesDir, path.dirname(file)).map((layout) => ({
          path: layout,
          props: routeProps,
        })),
  })
  return check && { env, check }
}

/**
 * Creates the provenance environment of a Waku app: `useRouter()` in client components gives the
 * page's `path` and `query`, and `useParams_UNSTABLE()` its slugs.
 * @param graph - The module graph.
 * @returns The environment, shared by the page and the components it renders.
 */
function createWakuEnvironment(graph: ModuleGraph): ProvenanceEnvironment {
  return {
    graph,
    parameterBindings: new Map(),
    resolveCall: (node) => {
      const name = getImportedName(graph, node.callee, routerSources)
      if (name === 'useRouter') {
        return {
          type: 'object',
          open: true,
          properties: [
            ['path', { type: 'member', object: routeProps, property: 'path' }],
            [
              'query',
              { type: 'member', object: routeProps, property: 'query' },
            ],
          ],
        }
      }
      if (name === 'useParams_UNSTABLE') {
        return routeProps
      }
      return undefined
    },
  }
}

/**
 * Finds the root and layouts that render the pages of a directory, outermost first.
 * @param pagesDir - The `pages` directory.
 * @param dir - The directory of the page or layout.
 * @returns The files' paths.
 */
function findLayouts(pagesDir: string, dir: string): Array<string> {
  return [
    path.join(pagesDir, '_root'),
    ...getDirsFrom(pagesDir, dir).map((current) =>
      path.join(current, '_layout'),
    ),
  ].flatMap((base) => findWithExtension(base, moduleExtensions) ?? [])
}

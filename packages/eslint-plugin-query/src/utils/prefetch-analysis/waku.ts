import fs from 'node:fs'
import path from 'node:path'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { getImport } from './provenance'
import { createServerCheck } from './server-components'
import type { ServerCheck } from './checks'
import type { ModuleGraph } from './module-graph'
import type { Provenance, ProvenanceEnvironment } from './provenance'

const routerSources = ['waku', 'waku/router/client']

/** The props of pages and layouts: the route's slugs, and the `path` and `query` of pages. */
const routeProps: Provenance = { type: 'binding', name: 'route' }

/** Directories of `src/pages` that don't contain pages. */
const ignoredDirectories = ['_api', '_components', '_hooks', '_actions']

const layoutExtensions = ['.tsx', '.ts', '.jsx', '.js']

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
  const pagesDir = findPagesDir(file)
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
      if (node.callee.type !== AST_NODE_TYPES.Identifier) {
        return undefined
      }
      const imported = getImport(graph, node.callee)
      if (imported === null || !routerSources.includes(imported.source)) {
        return undefined
      }
      if (imported.name === 'useRouter') {
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
      if (imported.name === 'useParams_UNSTABLE') {
        return routeProps
      }
      return undefined
    },
  }
}

/**
 * Finds the `pages` directory of a Waku app a file is in.
 * @param file - The file's absolute path.
 * @returns The `pages` directory, or `null` if the file isn't in one.
 */
function findPagesDir(file: string): string | null {
  const parts = path.dirname(file).split(path.sep)
  // The first `pages` directory, since routes can have folders named `pages` too.
  const index = parts.indexOf('pages')
  return index === -1 ? null : parts.slice(0, index + 1).join(path.sep)
}

/**
 * Finds the root and layouts that render the pages of a directory, outermost first.
 * @param pagesDir - The `pages` directory.
 * @param dir - The directory of the page or layout.
 * @returns The files' paths.
 */
function findLayouts(pagesDir: string, dir: string): Array<string> {
  const dirs: Array<string> = []
  for (let current = dir; ; current = path.dirname(current)) {
    dirs.unshift(current)
    if (current === pagesDir || path.dirname(current) === current) {
      break
    }
  }
  const find = (current: string, name: string) =>
    layoutExtensions
      .map((extension) => path.join(current, `${name}${extension}`))
      .filter((layout) => fs.existsSync(layout))
      .slice(0, 1)
  return [
    ...find(pagesDir, '_root'),
    ...dirs.flatMap((current) => find(current, '_layout')),
  ]
}

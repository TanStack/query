import fs from 'node:fs'
import path from 'node:path'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { getImport } from './provenance'
import { createServerCheck } from './server-components'
import type { ServerCheck } from './checks'
import type { ModuleGraph } from './module-graph'
import type { Provenance, ProvenanceEnvironment } from './provenance'

const navigationSource = 'next/navigation'

const params: Provenance = { type: 'binding', name: 'params' }
const searchParams: Provenance = { type: 'binding', name: 'searchParams' }
/** The `URLSearchParams` that `useSearchParams()` returns, which differs from the page's `searchParams`. */
const urlSearchParams: Provenance = {
  type: 'binding',
  name: 'urlSearchParams',
}

const entryFile = /^(page|layout)\.[cm]?[jt]sx?$/
const layoutExtensions = ['.tsx', '.jsx', '.ts', '.js']

/**
 * Creates the check for a Next.js App Router page or layout: the queries its client components use
 * have to be prefetched by a server component above them and dehydrated into a
 * `<HydrationBoundary>`.
 * @param graph - The module graph.
 * @returns The environment and the check, or `null` if the file isn't a page or layout of a Next.js
 * app.
 */
export function getNextCheck(
  graph: ModuleGraph,
): { env: ProvenanceEnvironment; check: ServerCheck } | null {
  const file = graph.current.path
  const match = entryFile.exec(path.basename(file))
  const appDir = findAppDir(file)
  if (
    match === null ||
    appDir === null ||
    !graph.projectDependencies().has('next')
  ) {
    return null
  }

  // Folders starting with `_` are private and not routed.
  if (
    path
      .relative(appDir, path.dirname(file))
      .split(path.sep)
      .some((part) => part.startsWith('_'))
  ) {
    return null
  }

  const env = createNextEnvironment(graph)
  const kind = match[1] as 'page' | 'layout'
  const check = createServerCheck(
    env,
    {
      site: kind === 'page' ? 'this page' : 'this layout',
      props: {
        type: 'object',
        open: true,
        properties:
          kind === 'page'
            ? [
                ['params', params],
                ['searchParams', searchParams],
              ]
            : [['params', params]],
      },
      layouts: findLayouts(appDir, path.dirname(file)).map((layout) => ({
        path: layout,
        props: {
          type: 'object',
          open: true,
          properties: [['params', params]],
        },
      })),
    },
    loosenSearchParams,
  )
  return check && { env, check }
}

/**
 * Creates the provenance environment of a Next.js app: `useParams()` in client components gives the
 * page's `params`, and `useSearchParams()` gives search params that differ from the page's
 * `searchParams`.
 * @param graph - The module graph.
 * @returns The environment, shared by the page and the components it renders.
 */
function createNextEnvironment(graph: ModuleGraph): ProvenanceEnvironment {
  return {
    graph,
    parameterBindings: new Map(),
    resolveCall: (node) => {
      if (node.callee.type !== AST_NODE_TYPES.Identifier) {
        return undefined
      }
      const imported = getImport(graph, node.callee)
      if (imported?.source !== navigationSource) {
        return undefined
      }
      if (imported.name === 'useParams') {
        return params
      }
      if (imported.name === 'useSearchParams') {
        return urlSearchParams
      }
      return undefined
    },
  }
}

/**
 * Rewrites `useSearchParams().get('page')` into `searchParams.page`, which differ only in the value
 * of a missing param.
 * @param provenance - The provenance to rewrite.
 * @returns The rewritten provenance.
 */
function loosenSearchParams(provenance: Provenance): Provenance {
  switch (provenance.type) {
    case 'call': {
      const [key] = provenance.args
      if (
        provenance.callee.type === 'member' &&
        provenance.callee.property === 'get' &&
        provenance.callee.object.type === 'binding' &&
        provenance.callee.object.name === 'urlSearchParams' &&
        provenance.args.length === 1 &&
        key?.type === 'literal' &&
        key.value.startsWith('string:')
      ) {
        return {
          type: 'member',
          object: searchParams,
          property: key.value.slice('string:'.length),
        }
      }
      return {
        ...provenance,
        callee: loosenSearchParams(provenance.callee),
        args: provenance.args.map(loosenSearchParams),
      }
    }
    case 'member':
      return { ...provenance, object: loosenSearchParams(provenance.object) }
    case 'operation':
      return {
        ...provenance,
        operands: provenance.operands.map(loosenSearchParams),
      }
    case 'object':
      return {
        ...provenance,
        properties: provenance.properties.map(([key, value]) => [
          key,
          value && loosenSearchParams(value),
        ]),
      }
    default:
      return provenance
  }
}

/**
 * Finds the `app` directory a file is in.
 * @param file - The file's absolute path.
 * @returns The `app` directory, or `null` if the file isn't in one.
 */
function findAppDir(file: string): string | null {
  const parts = path.dirname(file).split(path.sep)
  // The first `app` directory, since routes can have folders named `app` too.
  const index = parts.indexOf('app')
  return index === -1 ? null : parts.slice(0, index + 1).join(path.sep)
}

/**
 * Finds the layouts that render the pages of a directory, outermost first.
 * @param appDir - The `app` directory.
 * @param dir - The directory of the page or layout.
 * @returns The layout files' paths.
 */
function findLayouts(appDir: string, dir: string): Array<string> {
  const dirs: Array<string> = []
  for (let current = dir; ; current = path.dirname(current)) {
    dirs.unshift(current)
    if (current === appDir || path.dirname(current) === current) {
      break
    }
  }
  return dirs.flatMap((current) =>
    layoutExtensions
      .map((extension) => path.join(current, `layout${extension}`))
      .filter((layout) => fs.existsSync(layout))
      .slice(0, 1),
  )
}

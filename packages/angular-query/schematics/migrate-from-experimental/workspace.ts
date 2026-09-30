import { posix } from 'node:path'
import { getWorkspace } from '@schematics/angular/utility/workspace'
import { SchematicsException } from '@angular-devkit/schematics'
import ts from 'typescript'
import type { Tree } from '@angular-devkit/schematics'

// cspell:ignore subdirs

const ignoredDirectories = new Set([
  'node_modules',
  'dist',
  'build',
  '.git',
  '.angular',
  '.nx',
  '.cache',
  'coverage',
])

function isSource(path: string) {
  return /\.[cm]?tsx?$/.test(path) && !/\.d\.[cm]?ts$/.test(path)
}

/** Visit source directories without descending into dependencies or generated output. */
function sourcesUnder(tree: Tree, root: string): Array<string> {
  const files: Array<string> = []
  const visit = (path: string) => {
    const directory = tree.getDir(path)
    for (const name of directory.subfiles) {
      const file = posix.join(path, name)
      if (isSource(file)) files.push(file)
    }
    for (const name of directory.subdirs) {
      if (!ignoredDirectories.has(name)) visit(posix.join(path, name))
    }
  }
  visit(root)
  return files
}

/** TypeScript config patterns support *, ? and **; a bare directory includes its descendants. */
function configPattern(root: string, pattern: string): RegExp {
  let path = posix.resolve(root, pattern)
  if (!/[?*]/.test(path) && !posix.extname(path)) path += '/**/*'
  const segments = path.split('/')
  const expression = segments
    .map((segment, index) => {
      if (segment === '**')
        return index === segments.length - 1 ? '.*' : '(?:[^/]+/)*'
      const value = segment
        .split('')
        .map((character) => {
          if (character === '*') return '[^/]*'
          if (character === '?') return '[^/]'
          return character.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
        })
        .join('')
      return value + (index < segments.length - 1 ? '/' : '')
    })
    .join('')
  return new RegExp(`^${expression}$`)
}

function configuredSources(tree: Tree, configPath: string) {
  const readFile = (path: string) =>
    tree.exists(path) ? tree.readText(path) : undefined
  const config = ts.getParsedCommandLineOfConfigFile(
    configPath,
    { noLib: true },
    {
      useCaseSensitiveFileNames: true,
      getCurrentDirectory: () => '/',
      fileExists: (path) => tree.exists(path),
      readFile,
      readDirectory: (root, extensions, excludes, includes) => {
        const patterns = includes
        const roots = new Set([root])
        for (const pattern of patterns) {
          const prefix = posix.resolve(root, pattern).split(/[?*]/)[0]!
          roots.add(prefix.endsWith('/') ? prefix : posix.dirname(prefix))
        }
        const candidates = new Set(
          [...roots].flatMap((path) => sourcesUnder(tree, path)),
        )
        return [...candidates].filter(
          (path) =>
            extensions.some((extension) => path.endsWith(extension)) &&
            patterns.some((pattern) =>
              configPattern(root, pattern).test(path),
            ) &&
            !(excludes ?? []).some((pattern) =>
              configPattern(root, pattern).test(path),
            ),
        )
      },
      onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
        throw new SchematicsException(
          ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        )
      },
    },
  )
  if (!config) return []
  const host = ts.createCompilerHost(config.options)
  host.getCurrentDirectory = () => '/'
  host.fileExists = (path) => tree.exists(path)
  host.readFile = readFile
  host.realpath = (path) => path
  host.directoryExists = (path) => {
    const directory = tree.getDir(path)
    return directory.subfiles.length > 0 || directory.subdirs.length > 0
  }
  host.getSourceFile = (path) => {
    if (path.split('/').some((part) => ignoredDirectories.has(part)))
      return undefined
    const text = readFile(path)
    return text === undefined
      ? undefined
      : ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true)
  }
  return ts
    .createProgram(config.fileNames, config.options, host)
    .getSourceFiles()
    .map((source) => source.fileName)
    .filter(isSource)
}

/** Use build/test configurations, including inherited configs and relative source imports. */
export async function migrationWorkspace(tree: Tree) {
  const manifests = new Set<string>()
  if (tree.exists('/package.json')) manifests.add('/package.json')
  if (!tree.exists('/angular.json') && !tree.exists('/.angular.json'))
    return { files: sourcesUnder(tree, '/'), manifests: [...manifests] }

  const workspace = await getWorkspace(
    tree,
    tree.exists('/angular.json') ? '/angular.json' : '/.angular.json',
  )
  const files = new Set<string>()
  for (const project of workspace.projects.values()) {
    const manifest = posix.resolve('/', project.root, 'package.json')
    if (tree.exists(manifest)) manifests.add(manifest)
    const configs = new Set<string>()
    for (const target of project.targets.values()) {
      for (const options of [
        target.options,
        ...Object.values(target.configurations ?? {}),
      ]) {
        if (
          typeof options?.tsConfig === 'string' &&
          tree.exists(options.tsConfig)
        )
          configs.add(posix.resolve('/', options.tsConfig))
      }
    }
    const sources = configs.size
      ? [...configs].flatMap((path) => configuredSources(tree, path))
      : sourcesUnder(
          tree,
          posix.resolve('/', project.sourceRoot ?? project.root),
        )
    for (const path of sources) files.add(path)
  }
  return { files: [...files], manifests: [...manifests] }
}

/** Associate each source with its closest declared workspace package. */
export function sourceManifest(path: string, manifests: Array<string>) {
  return [...manifests]
    .sort((a, b) => b.length - a.length)
    .find((manifest) =>
      path.startsWith(`${posix.dirname(manifest).replace(/\/$/, '')}/`),
    )
}

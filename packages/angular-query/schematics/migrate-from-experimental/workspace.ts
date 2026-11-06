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

/** Visit files without descending into dependencies or generated output. */
function filesUnder(tree: Tree, root: string): Array<string> {
  const files: Array<string> = []
  const visit = (path: string) => {
    const directory = tree.getDir(path)
    for (const name of directory.subfiles) {
      const file = posix.join(path, name)
      files.push(file)
    }
    for (const name of directory.subdirs) {
      if (!ignoredDirectories.has(name)) visit(posix.join(path, name))
    }
  }
  visit(root)
  return files
}

function sourcesUnder(tree: Tree, root: string) {
  return filesUnder(tree, root).filter(isSource)
}

/** Include declarations, JavaScript, and component files when checking dependency references. */
export function packageReferenceFiles(tree: Tree, packageName: string) {
  return filesUnder(tree, '/').filter((path) => {
    const isComponent = /\.(vue|svelte|astro)$/.test(path)
    if (!isComponent && !/\.[cm]?[jt]sx?$/.test(path)) return false
    const text = tree.readText(path)
    if (!text.includes(packageName)) return false
    if (isComponent) return true
    const containsReference = (node: ts.Node): boolean => {
      if (ts.isStringLiteralLike(node) || ts.isTemplateHead(node))
        return (
          node.text === packageName || node.text.startsWith(`${packageName}/`)
        )
      return ts.forEachChild(node, containsReference) ?? false
    }
    return containsReference(
      ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true),
    )
  })
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

function configuredSources(
  tree: Tree,
  configPath: string,
  visited = new Set<string>(),
): Array<string> {
  if (visited.has(configPath)) return []
  visited.add(configPath)
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
    // TypeScript also probes file paths here; `getDir` throws on those.
    if (tree.exists(path)) return false
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
  const sources = ts
    .createProgram(config.fileNames, config.options, host)
    .getSourceFiles()
    .map((source) => source.fileName)
    .filter(isSource)
  return [
    ...sources,
    ...(config.projectReferences ?? []).flatMap((reference) =>
      configuredSources(
        tree,
        ts.resolveProjectReferencePath(reference),
        visited,
      ),
    ),
  ]
}

type Target = {
  options?: Record<string, unknown>
  configurations?: Record<string, Record<string, unknown> | undefined>
}
type ProjectConfig = {
  root?: string
  sourceRoot?: string
  targets?: Record<string, Target>
}

/** Use Angular/Nx projects and their declared configs, including inherited configs and local imports. */
export async function migrationWorkspace(tree: Tree) {
  const manifests = new Set<string>()
  if (tree.exists('/package.json')) manifests.add('/package.json')
  const projects = new Map<
    string,
    {
      sourceRoot?: string
      configs: Set<string>
      hasExplicitTestConfig: boolean
    }
  >()
  const addProject = (
    root: string,
    sourceRoot: string | undefined,
    targets: Iterable<[string, Target]>,
  ) => {
    root = posix.resolve('/', root)
    const project = projects.get(root) ?? {
      sourceRoot,
      configs: new Set<string>(),
      hasExplicitTestConfig: false,
    }
    project.sourceRoot ??= sourceRoot
    projects.set(root, project)
    const manifest = posix.join(root, 'package.json')
    if (tree.exists(manifest)) manifests.add(manifest)
    for (const [name, target] of targets) {
      for (const options of [
        target.options,
        ...Object.values(target.configurations ?? {}),
      ]) {
        const tsConfig = options?.tsConfig
        if (typeof tsConfig !== 'string') continue
        if (name === 'test' || name.startsWith('test:'))
          project.hasExplicitTestConfig = true
        const config = posix.resolve('/', tsConfig)
        if (tree.exists(config)) project.configs.add(config)
      }
    }
  }
  if (tree.exists('/angular.json') || tree.exists('/.angular.json')) {
    const workspace = await getWorkspace(
      tree,
      tree.exists('/angular.json') ? '/angular.json' : '/.angular.json',
    )
    for (const project of workspace.projects.values())
      addProject(project.root, project.sourceRoot, project.targets.entries())
  }
  if (tree.exists('/nx.json')) {
    for (const path of filesUnder(tree, '/')) {
      if (posix.basename(path) === 'project.json') {
        const project = tree.readJson(path) as ProjectConfig
        addProject(
          project.root ?? posix.dirname(path),
          project.sourceRoot,
          Object.entries(project.targets ?? {}),
        )
      } else if (posix.basename(path) === 'package.json') {
        const pkg = tree.readJson(path) as { nx?: ProjectConfig }
        if (pkg.nx)
          addProject(
            posix.dirname(path),
            pkg.nx.sourceRoot,
            Object.entries(pkg.nx.targets ?? {}),
          )
      }
    }
  }
  if (!projects.size) addProject('/', undefined, [])
  const files = new Set<string>()
  for (const [root, project] of projects) {
    // Infer defaults only after Angular and Nx declarations have been merged.
    if (!project.configs.size) {
      for (const name of [
        'tsconfig.json',
        'tsconfig.app.json',
        'tsconfig.lib.json',
      ]) {
        const config = posix.join(root, name)
        if (tree.exists(config)) project.configs.add(config)
      }
    }
    const testConfigs = project.hasExplicitTestConfig
      ? []
      : ['tsconfig.spec.json', 'tsconfig.test.json']
          .map((name) => posix.join(root, name))
          .filter((path) => tree.exists(path))

    const sources = project.configs.size
      ? [...project.configs].flatMap((path) => configuredSources(tree, path))
      : sourcesUnder(
          tree,
          posix.resolve('/', project.sourceRoot ?? root),
        ).filter(
          (path) =>
            !testConfigs.length || !/\.(spec|test)\.[cm]?tsx?$/.test(path),
        )
    for (const path of [
      ...sources,
      ...testConfigs.flatMap((configPath) =>
        configuredSources(tree, configPath),
      ),
    ])
      files.add(path)
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

import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import {
  AST_NODE_TYPES,
  ASTUtils as TSESLintASTUtils,
} from '@typescript-eslint/utils'
import type { TSESLint, TSESTree } from '@typescript-eslint/utils'

/**
 * The parts of a parsed file the analysis uses, available for the file being linted and for files it
 * imports.
 */
interface AnalyzedSource {
  /** The file's text. */
  text: string
  /** The file's AST. */
  ast: TSESTree.Program
  /** The keys of each node type that hold child nodes. */
  visitorKeys: Readonly<Record<string, ReadonlyArray<string> | undefined>>
  /**
   * Returns the innermost scope that contains a node.
   * @param node - The node to find the scope of.
   * @returns The scope.
   */
  getScope: (node: TSESTree.Node) => TSESLint.Scope.Scope
  /**
   * Returns the source text of a node.
   * @param node - The node to get the text of.
   * @returns The text.
   */
  getText: (node: TSESTree.Node) => string
}

/**
 * A file of the module graph.
 */
export interface ModuleFile {
  /** The file's absolute path. */
  path: string
  /** The parsed file. */
  source: AnalyzedSource
  /** The file's `'use client'` or `'use server'` directive, if it has one. */
  directive: 'use client' | 'use server' | null
}

/**
 * An export of a module: the module, identified by its absolute path for files of the project or by
 * its specifier for packages, and the exported name.
 */
export interface ModuleExport {
  /** The module's absolute path, or its specifier for packages. */
  module: string
  /** The exported name, `default`, or `*` for a namespace import. */
  name: string
  /**
   * The first file with a `'use client'` directive the export was re-exported through, if any, which
   * makes it a client reference for the server components that import it from there.
   */
  clientModule?: string
}

interface Parser {
  parseForESLint?: (
    text: string,
    options: Record<string, unknown>,
  ) => {
    ast: TSESTree.Program
    scopeManager?: TSESLint.Scope.ScopeManager | null
    visitorKeys?: AnalyzedSource['visitorKeys']
  }
}

interface CachedFile {
  mtimeMs: number
  size: number
  file: ModuleFile | null
}

const extensions = [
  '.tsx',
  '.ts',
  '.jsx',
  '.js',
  '.mts',
  '.mjs',
  '.cts',
  '.cjs',
]

const parsedFiles = new WeakMap<object, Map<string, CachedFile>>()

/**
 * How long, in milliseconds, file system lookups are reused before files are checked again, so
 * long-running processes like editors see files that change while linting other files.
 */
const maxLookupAge = 1000

/**
 * File system lookups shared by the files linted in one run, so each file is checked once per run
 * instead of each time the analysis follows an import of it.
 */
interface Lookups {
  /** When the lookups were started, from `performance.now()`. */
  startedAt: number
  /** The files linted with these lookups. */
  linted: Set<string>
  /** The size and modification time of each checked path, or `null` if it isn't a file. */
  stats: Map<string, { mtimeMs: number; size: number } | null>
  /** The file each import path resolved to. */
  resolved: Map<string, string | null>
}

let lookups: Lookups = createLookups()

/**
 * Starts linting a file with the file system lookups of the current run. A run ends, and files are
 * checked again, when a file is linted a second time (as editors do when it changes) or after
 * `maxLookupAge`.
 * @param filePath - The absolute path of the file being linted.
 */
function startLint(filePath: string): void {
  if (
    lookups.linted.has(filePath) ||
    performance.now() - lookups.startedAt > maxLookupAge
  ) {
    lookups = createLookups()
  }
  lookups.linted.add(filePath)
}

/**
 * Creates empty file system lookups for a new run.
 * @returns Lookups with nothing checked yet.
 */
function createLookups(): Lookups {
  return {
    startedAt: performance.now(),
    linted: new Set(),
    stats: new Map(),
    resolved: new Map(),
  }
}

/**
 * Returns the size and modification time of a file, checking it once per run.
 * @param filePath - The absolute path.
 * @returns The file's size and modification time, or `null` if it isn't a file.
 */
function statFile(filePath: string): { mtimeMs: number; size: number } | null {
  const cached = lookups.stats.get(filePath)
  if (cached !== undefined) {
    return cached
  }
  let result: { mtimeMs: number; size: number } | null = null
  try {
    const stat = fs.statSync(filePath)
    if (stat.isFile()) {
      result = { mtimeMs: stat.mtimeMs, size: stat.size }
    }
  } catch {
    // Not a file.
  }
  lookups.stats.set(filePath, result)
  return result
}
const tsconfigs = new Map<string, TsconfigPaths | null>()
const packageDependencies = new Map<string, Set<string> | null>()

interface TsconfigPaths {
  baseUrl: string
  paths: Record<string, Array<string>>
}

/**
 * The file being linted and the files it imports, which are parsed with the same parser when the
 * analysis follows an import.
 */
export class ModuleGraph {
  /** The file being linted. */
  readonly current: ModuleFile
  private readonly parser: Parser | null
  private readonly parserOptions: Record<string, unknown>
  private readonly files = new Map<TSESTree.Program, ModuleFile>()

  /**
   * Creates the module graph for the file a rule is linting.
   * @param context - The rule's context, which provides the file and the parser.
   */
  constructor(
    context: Readonly<TSESLint.RuleContext<string, ReadonlyArray<unknown>>>,
  ) {
    this.current = {
      path: path.resolve(context.physicalFilename),
      source: context.sourceCode,
      directive: getDirective(context.sourceCode.ast),
    }
    this.files.set(context.sourceCode.ast, this.current)
    startLint(this.current.path)
    this.parser = getParser(context)
    this.parserOptions = {
      ...context.languageOptions.parserOptions,
      // Imported files are only parsed, so they don't need type information.
      project: undefined,
      projectService: undefined,
      programs: undefined,
    }
  }

  /**
   * Returns the file a node belongs to.
   * @param node - A node of the current file or of a file the graph loaded.
   * @returns The node's file.
   */
  fileOf(node: TSESTree.Node): ModuleFile {
    let current: TSESTree.Node = node
    while (current.parent) {
      current = current.parent
    }
    return this.files.get(current) ?? this.current
  }

  /**
   * Resolves an import specifier to a file of the project, following relative paths and the `paths`
   * of the nearest `tsconfig.json`.
   * @param specifier - The import specifier.
   * @param from - The path of the importing file.
   * @returns The absolute path of the imported file, or `null` for packages and missing files.
   */
  resolve(specifier: string, from: string): string | null {
    if (specifier.startsWith('.') || path.isAbsolute(specifier)) {
      return resolveFile(path.resolve(path.dirname(from), specifier))
    }
    const tsconfig = findTsconfigPaths(path.dirname(from))
    if (tsconfig === null) {
      return null
    }
    for (const [pattern, targets] of Object.entries(tsconfig.paths)) {
      const match = matchPathPattern(pattern, specifier)
      if (match === null) {
        continue
      }
      for (const target of targets) {
        const resolved = resolveFile(
          path.resolve(tsconfig.baseUrl, target.replace('*', match)),
        )
        if (resolved !== null) {
          return resolved
        }
      }
    }
    return null
  }

  /**
   * Returns the ID used to compare a module with others: its path if it is a file of the project,
   * or its specifier otherwise.
   * @param specifier - The import specifier.
   * @param from - The path of the importing file.
   * @returns The absolute path of a file of the project, or the specifier of a package.
   */
  moduleId(specifier: string, from: string): string {
    const resolved = this.resolve(specifier, from)
    if (resolved !== null) {
      return resolved
    }
    return specifier.startsWith('.')
      ? path.resolve(path.dirname(from), specifier)
      : specifier
  }

  /**
   * Parses a file of the project, using a cache that is shared by all files linted with the same
   * parser.
   * @param filePath - The absolute path of the file.
   * @returns The file, or `null` if it can't be read or parsed.
   */
  load(filePath: string): ModuleFile | null {
    if (filePath === this.current.path) {
      return this.current
    }
    if (this.parser?.parseForESLint === undefined) {
      return null
    }

    const stat = statFile(filePath)
    if (stat === null) {
      return null
    }

    let cache = parsedFiles.get(this.parser)
    if (cache === undefined) {
      cache = new Map()
      parsedFiles.set(this.parser, cache)
    }

    const cached = cache.get(filePath)
    if (
      cached !== undefined &&
      cached.mtimeMs === stat.mtimeMs &&
      cached.size === stat.size
    ) {
      if (cached.file !== null) {
        this.files.set(cached.file.source.ast, cached.file)
      }
      return cached.file
    }

    const file = parseFile(this.parser, this.parserOptions, filePath)
    cache.set(filePath, { mtimeMs: stat.mtimeMs, size: stat.size, file })
    if (file !== null) {
      this.files.set(file.source.ast, file)
    }
    return file
  }

  /**
   * Loads the file a module ID refers to.
   * @param module - A module ID from `moduleId`.
   * @returns The file, or `null` for packages and files that can't be loaded.
   */
  loadModule(module: string): ModuleFile | null {
    return path.isAbsolute(module) ? this.load(module) : null
  }

  /**
   * Finds the value a module exports under a name, following re-exports.
   * @param module - A module ID from `moduleId`.
   * @param name - The exported name, or `default`.
   * @param seen - The exports being resolved, to stop on circular re-exports.
   * @returns The file that declares the value and the node of its declaration or initializer, or
   * `null` if the export can't be found.
   */
  findExport(
    module: string,
    name: string,
    seen = new Set<string>(),
  ): { file: ModuleFile; node: TSESTree.Node } | null {
    const key = `${module}#${name}`
    const file = this.loadModule(module)
    if (file === null || seen.has(key)) {
      return null
    }
    seen.add(key)

    for (const statement of file.source.ast.body) {
      if (statement.type === AST_NODE_TYPES.ExportDefaultDeclaration) {
        if (name !== 'default') {
          continue
        }
        if (statement.declaration.type === AST_NODE_TYPES.Identifier) {
          return this.findLocal(file, statement.declaration, seen)
        }
        return { file, node: statement.declaration }
      }

      if (statement.type === AST_NODE_TYPES.ExportAllDeclaration) {
        if (statement.exported !== null || name === 'default') {
          continue
        }
        const found = this.findExport(
          this.moduleId(statement.source.value, file.path),
          name,
          seen,
        )
        if (found !== null) {
          return found
        }
        continue
      }

      if (statement.type !== AST_NODE_TYPES.ExportNamedDeclaration) {
        continue
      }

      const declaration = statement.declaration
      if (
        declaration?.type === AST_NODE_TYPES.FunctionDeclaration &&
        declaration.id?.name === name
      ) {
        return { file, node: declaration }
      }
      if (declaration?.type === AST_NODE_TYPES.VariableDeclaration) {
        for (const declarator of declaration.declarations) {
          if (
            declarator.id.type === AST_NODE_TYPES.Identifier &&
            declarator.id.name === name &&
            declarator.init !== null
          ) {
            return { file, node: declarator.init }
          }
        }
      }

      for (const specifier of statement.specifiers) {
        if (getName(specifier.exported) !== name) {
          continue
        }
        if (statement.source !== null) {
          return this.findExport(
            this.moduleId(statement.source.value, file.path),
            getName(specifier.local),
            seen,
          )
        }
        if (specifier.local.type === AST_NODE_TYPES.Identifier) {
          return this.findLocal(file, specifier.local, seen)
        }
      }
    }

    return null
  }

  /**
   * Returns the module export a module-level variable or import stands for, so references to the
   * same value from different files can be compared.
   * @param variable - A module-level variable.
   * @returns The export: the original export of an import, following re-exports, or the variable's
   * own module and exported name.
   */
  identify(variable: TSESLint.Scope.Variable): ModuleExport {
    const definition = variable.defs[0]
    const file =
      definition === undefined ? this.current : this.fileOf(definition.name)

    if (
      definition?.type === 'ImportBinding' &&
      definition.parent.type === AST_NODE_TYPES.ImportDeclaration
    ) {
      const imported =
        definition.node.type === AST_NODE_TYPES.ImportSpecifier
          ? getName(definition.node.imported)
          : definition.node.type === AST_NODE_TYPES.ImportDefaultSpecifier
            ? 'default'
            : '*'
      return this.canonicalize(
        {
          module: this.moduleId(definition.parent.source.value, file.path),
          name: imported,
        },
        new Set(),
      )
    }

    return { module: file.path, name: getExportedName(file, variable) }
  }

  /**
   * Checks whether a module ID refers to a file with a `'use client'` directive.
   * @param module - A module ID from `moduleId`.
   * @returns `true` if the module's exports are client references for server components.
   */
  isClientModule(module: string): boolean {
    return this.loadModule(module)?.directive === 'use client'
  }

  /**
   * Returns the dependencies listed in the nearest `package.json` above the current file, used to
   * detect which frameworks the project uses.
   * @returns The names of the project's dependencies.
   */
  projectDependencies(): Set<string> {
    let dir = path.dirname(this.current.path)
    for (;;) {
      const cached = packageDependencies.get(dir)
      if (cached !== undefined) {
        if (cached !== null) {
          return cached
        }
      } else {
        const dependencies = readPackageDependencies(dir)
        packageDependencies.set(dir, dependencies)
        if (dependencies !== null) {
          return dependencies
        }
      }
      const parent = path.dirname(dir)
      if (parent === dir) {
        return new Set()
      }
      dir = parent
    }
  }

  /**
   * Finds the declaration of a module-level identifier of a file, following imports to the module
   * that declares it.
   * @param file - The file the identifier belongs to.
   * @param identifier - The exported or default exported identifier.
   * @param seen - The exports being resolved, to stop on circular imports.
   * @returns The declaring file and the node of the declaration or initializer, or `null`.
   */
  private findLocal(
    file: ModuleFile,
    identifier: TSESTree.Identifier,
    seen: Set<string>,
  ): { file: ModuleFile; node: TSESTree.Node } | null {
    const definition = TSESLintASTUtils.findVariable(
      file.source.getScope(identifier),
      identifier,
    )?.defs[0]
    if (definition === undefined) {
      return null
    }
    if (definition.type === 'FunctionName') {
      return { file, node: definition.node }
    }
    if (definition.type === 'Variable' && definition.node.init !== null) {
      return { file, node: definition.node.init }
    }
    if (
      definition.type === 'ImportBinding' &&
      definition.parent.type === AST_NODE_TYPES.ImportDeclaration
    ) {
      const module = this.moduleId(definition.parent.source.value, file.path)
      if (definition.node.type === AST_NODE_TYPES.ImportSpecifier) {
        return this.findExport(module, getName(definition.node.imported), seen)
      }
      if (definition.node.type === AST_NODE_TYPES.ImportDefaultSpecifier) {
        return this.findExport(module, 'default', seen)
      }
    }
    return null
  }

  /**
   * Follows re-exports from an export to the module that declares the value.
   * @param exported - The export to follow.
   * @param seen - The exports being followed, to stop on circular re-exports.
   * @returns The original export.
   */
  private canonicalize(
    exported: ModuleExport,
    seen: Set<string>,
  ): ModuleExport {
    const key = `${exported.module}#${exported.name}`
    const file = this.loadModule(exported.module)
    if (file === null || exported.name === '*' || seen.has(key)) {
      return exported
    }
    seen.add(key)
    // An export followed out of a `'use client'` file stays a client reference for the server.
    const follow = (next: ModuleExport): ModuleExport =>
      file.directive === 'use client'
        ? { ...next, clientModule: file.path }
        : next

    for (const statement of file.source.ast.body) {
      if (
        statement.type === AST_NODE_TYPES.ExportAllDeclaration &&
        statement.exported === null &&
        exported.name !== 'default'
      ) {
        const module = this.moduleId(statement.source.value, file.path)
        if (this.findExport(module, exported.name) !== null) {
          return follow(
            this.canonicalize({ module, name: exported.name }, seen),
          )
        }
      }

      if (statement.type !== AST_NODE_TYPES.ExportNamedDeclaration) {
        continue
      }
      for (const specifier of statement.specifiers) {
        if (getName(specifier.exported) !== exported.name) {
          continue
        }
        if (statement.source !== null) {
          return follow(
            this.canonicalize(
              {
                module: this.moduleId(statement.source.value, file.path),
                name: getName(specifier.local),
              },
              seen,
            ),
          )
        }
        if (specifier.local.type !== AST_NODE_TYPES.Identifier) {
          continue
        }
        const variable = TSESLintASTUtils.findVariable(
          file.source.getScope(specifier.local),
          specifier.local,
        )
        if (variable?.defs[0]?.type === 'ImportBinding') {
          return follow(this.identify(variable))
        }
      }
    }

    return exported
  }
}

/**
 * Returns the parser of the file being linted, so imported files are parsed the same way.
 * @param context - The rule's context.
 * @returns The parser, or `null` if it isn't available.
 */
function getParser(
  context: Readonly<TSESLint.RuleContext<string, ReadonlyArray<unknown>>>,
): Parser | null {
  const parser = context.languageOptions.parser as Parser | undefined
  if (parser !== undefined) {
    return parser
  }
  if (context.parserPath === undefined) {
    return null
  }
  try {
    return createRequire(context.physicalFilename)(context.parserPath) as Parser
  } catch {
    return null
  }
}

/**
 * Parses a file into the structures the analysis needs.
 * @param parser - The parser to use.
 * @param parserOptions - The options of the parser of the file being linted.
 * @param filePath - The file's absolute path.
 * @returns The parsed file, or `null` if it can't be read or parsed.
 */
function parseFile(
  parser: Parser,
  parserOptions: Record<string, unknown>,
  filePath: string,
): ModuleFile | null {
  try {
    const text = fs.readFileSync(filePath, 'utf8')
    const result = parser.parseForESLint!(text, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      ...parserOptions,
      ecmaFeatures: { jsx: true },
      filePath,
      range: true,
      loc: true,
      tokens: false,
      comment: false,
    })
    const scopeManager = result.scopeManager
    const visitorKeys = result.visitorKeys
    if (!scopeManager || !visitorKeys) {
      return null
    }
    setParents(result.ast, visitorKeys)
    const source: AnalyzedSource = {
      text,
      ast: result.ast,
      visitorKeys,
      getScope: (node) => getScope(scopeManager, node),
      getText: (node) => text.slice(node.range[0], node.range[1]),
    }
    return { path: filePath, source, directive: getDirective(result.ast) }
  } catch {
    return null
  }
}

/**
 * Sets the `parent` of every node, which parsers leave to ESLint.
 * @param root - The program.
 * @param visitorKeys - The keys of each node type that hold child nodes.
 */
function setParents(
  root: TSESTree.Node,
  visitorKeys: AnalyzedSource['visitorKeys'],
): void {
  const stack: Array<TSESTree.Node> = [root]
  while (stack.length > 0) {
    const node = stack.pop()!
    for (const key of visitorKeys[node.type] ?? []) {
      const child = (node as unknown as Record<string, unknown>)[key]
      for (const value of Array.isArray(child) ? child : [child]) {
        if (
          typeof value === 'object' &&
          value !== null &&
          typeof (value as { type?: unknown }).type === 'string'
        ) {
          ;(value as { parent: TSESTree.Node }).parent = node
          stack.push(value as TSESTree.Node)
        }
      }
    }
  }
}

/**
 * Returns the innermost scope that contains a node, the same way `SourceCode#getScope` does.
 * @param scopeManager - The file's scope manager.
 * @param node - The node to find the scope of.
 * @returns The innermost scope, or the global scope.
 */
function getScope(
  scopeManager: TSESLint.Scope.ScopeManager,
  node: TSESTree.Node,
): TSESLint.Scope.Scope {
  const inner = node.type !== AST_NODE_TYPES.Program
  for (
    let current: TSESTree.Node | undefined = node;
    current;
    current = current.parent
  ) {
    const scope = scopeManager.acquire(current, inner)
    if (scope) {
      return scope.type === 'function-expression-name'
        ? scope.childScopes[0]!
        : scope
    }
  }
  return scopeManager.scopes[0]!
}

/**
 * Reads a file's `'use client'` or `'use server'` directive.
 * @param program - The file's AST.
 * @returns The directive, or `null` if the file doesn't start with one.
 */
function getDirective(program: TSESTree.Program): ModuleFile['directive'] {
  for (const statement of program.body) {
    if (
      statement.type !== AST_NODE_TYPES.ExpressionStatement ||
      statement.directive === undefined
    ) {
      return null
    }
    if (
      statement.directive === 'use client' ||
      statement.directive === 'use server'
    ) {
      return statement.directive
    }
  }
  return null
}

/**
 * Returns the name of an identifier or string literal used in an import or export.
 * @param node - The identifier or string literal.
 * @returns The identifier's name or the literal's value.
 */
function getName(node: TSESTree.Identifier | TSESTree.StringLiteral): string {
  return node.type === AST_NODE_TYPES.Identifier ? node.name : node.value
}

/**
 * Returns the name a module-level variable is exported under, so it compares equal to imports of it.
 * @param file - The file that declares the variable.
 * @param variable - The module-level variable to find the export of.
 * @returns The exported name, or the variable's name if it isn't exported under another name.
 */
function getExportedName(
  file: ModuleFile,
  variable: TSESLint.Scope.Variable,
): string {
  for (const statement of file.source.ast.body) {
    if (
      statement.type === AST_NODE_TYPES.ExportDefaultDeclaration &&
      ((statement.declaration.type === AST_NODE_TYPES.Identifier &&
        statement.declaration.name === variable.name) ||
        variable.defs.some((def) => def.node === statement.declaration))
    ) {
      return 'default'
    }
    if (
      statement.type === AST_NODE_TYPES.ExportNamedDeclaration &&
      statement.source === null
    ) {
      for (const specifier of statement.specifiers) {
        if (getName(specifier.local) === variable.name) {
          return getName(specifier.exported)
        }
      }
    }
  }
  return variable.name
}

/**
 * Finds the file an import path refers to, trying the extensions and index files TypeScript and
 * bundlers resolve.
 * @param base - The absolute import path.
 * @returns The file's path, or `null` if no file exists.
 */
function resolveFile(base: string): string | null {
  const cached = lookups.resolved.get(base)
  if (cached !== undefined) {
    return cached
  }
  const withoutJsExtension = base.replace(/\.(m|c)?jsx?$/, '')
  const candidates = [
    base,
    ...extensions.map((extension) => base + extension),
    ...extensions.map((extension) => withoutJsExtension + extension),
    ...extensions.map((extension) => path.join(base, `index${extension}`)),
  ]
  const resolved =
    candidates.find((candidate) => statFile(candidate) !== null) ?? null
  lookups.resolved.set(base, resolved)
  return resolved
}

/**
 * Matches an import specifier against a `paths` pattern of a `tsconfig.json`.
 * @param pattern - The pattern, such as `@/*`.
 * @param specifier - The import specifier.
 * @returns The text matched by the pattern's `*`, or `null` if it doesn't match.
 */
function matchPathPattern(pattern: string, specifier: string): string | null {
  const star = pattern.indexOf('*')
  if (star === -1) {
    return pattern === specifier ? '' : null
  }
  const prefix = pattern.slice(0, star)
  const suffix = pattern.slice(star + 1)
  return specifier.startsWith(prefix) &&
    specifier.endsWith(suffix) &&
    specifier.length >= prefix.length + suffix.length
    ? specifier.slice(prefix.length, specifier.length - suffix.length)
    : null
}

/**
 * Reads the `paths` of the nearest `tsconfig.json` (or `jsconfig.json`) above a directory, following
 * relative `extends`.
 * @param dir - The directory to start from.
 * @returns The paths and the directory they are relative to, or `null` if there are none.
 */
function findTsconfigPaths(dir: string): TsconfigPaths | null {
  const cached = tsconfigs.get(dir)
  if (cached !== undefined) {
    return cached
  }

  let result: TsconfigPaths | null = null
  const configFile = ['tsconfig.json', 'jsconfig.json']
    .map((name) => path.join(dir, name))
    .find((file) => fs.existsSync(file))

  if (configFile !== undefined) {
    result = readTsconfigPaths(configFile, new Set())
  } else {
    const parent = path.dirname(dir)
    result = parent === dir ? null : findTsconfigPaths(parent)
  }

  tsconfigs.set(dir, result)
  return result
}

/**
 * Reads the `paths` of a `tsconfig.json`, following relative `extends`.
 * @param file - The config file.
 * @param seen - The config files being read, to stop on circular `extends`.
 * @returns The paths and the directory they are relative to, or `null` if there are none.
 */
function readTsconfigPaths(
  file: string,
  seen: Set<string>,
): TsconfigPaths | null {
  if (seen.has(file)) {
    return null
  }
  seen.add(file)

  let config: {
    extends?: unknown
    compilerOptions?: { baseUrl?: unknown; paths?: unknown }
  }
  try {
    config = JSON.parse(stripJsonComments(fs.readFileSync(file, 'utf8')))
  } catch {
    return null
  }

  const dir = path.dirname(file)
  const options = config.compilerOptions ?? {}
  if (typeof options.paths === 'object' && options.paths !== null) {
    return {
      baseUrl:
        typeof options.baseUrl === 'string'
          ? path.resolve(dir, options.baseUrl)
          : dir,
      paths: options.paths as Record<string, Array<string>>,
    }
  }

  const extendsList = Array.isArray(config.extends)
    ? config.extends
    : [config.extends]
  for (const extended of extendsList.reverse()) {
    if (typeof extended === 'string' && extended.startsWith('.')) {
      const target = path.resolve(dir, extended)
      const found = readTsconfigPaths(
        target.endsWith('.json') ? target : `${target}.json`,
        seen,
      )
      if (found !== null) {
        return found
      }
    }
  }
  return null
}

/**
 * Removes comments and trailing commas from JSON, as `tsconfig.json` allows them.
 * @param text - The JSON text with comments.
 * @returns Text that `JSON.parse` accepts.
 */
function stripJsonComments(text: string): string {
  let result = ''
  let inString = false
  for (let index = 0; index < text.length; index++) {
    const char = text[index]!
    const next = text[index + 1]
    if (inString) {
      result += char
      if (char === '\\') {
        result += next ?? ''
        index++
      } else if (char === '"') {
        inString = false
      }
    } else if (char === '"') {
      inString = true
      result += char
    } else if (char === '/' && next === '/') {
      while (index < text.length && text[index] !== '\n') {
        index++
      }
      result += '\n'
    } else if (char === '/' && next === '*') {
      index += 2
      while (
        index < text.length &&
        !(text[index] === '*' && text[index + 1] === '/')
      ) {
        index++
      }
      index++
    } else {
      result += char
    }
  }
  return result.replace(/,(\s*[}\]])/g, '$1')
}

/**
 * Reads the dependency names of a `package.json`.
 * @param dir - The directory that may contain a `package.json`.
 * @returns The names of its dependencies, or `null` if the directory has no `package.json`.
 */
function readPackageDependencies(dir: string): Set<string> | null {
  try {
    const json = JSON.parse(
      fs.readFileSync(path.join(dir, 'package.json'), 'utf8'),
    ) as Record<string, unknown>
    const names = new Set<string>()
    for (const key of ['dependencies', 'devDependencies', 'peerDependencies']) {
      const value = json[key]
      if (typeof value === 'object' && value !== null) {
        Object.keys(value).forEach((name) => names.add(name))
      }
    }
    return names
  } catch {
    return null
  }
}

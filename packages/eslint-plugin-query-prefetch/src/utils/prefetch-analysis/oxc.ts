import { createRequire } from 'node:module'
import { analyze } from '@typescript-eslint/scope-manager'
import { visitorKeys } from '@typescript-eslint/visitor-keys'
import type { AnalyzeOptions } from '@typescript-eslint/scope-manager'
import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import type * as OxcParser from 'oxc-parser'

/**
 * A file parsed with `oxc-parser`, with its scopes analyzed.
 */
export interface OxcParseResult {
  /** The file's AST, without `loc`, tokens, comments, or `parent` links. */
  ast: TSESTree.Program
  /** The file's scopes. */
  scopeManager: TSESLint.Scope.ScopeManager
  /** The keys of each node type that hold child nodes. */
  visitorKeys: Readonly<Record<string, ReadonlyArray<string> | undefined>>
}

interface Oxc {
  parser: typeof OxcParser
  rawTransfer: boolean
}

let oxc: Oxc | null | undefined

/**
 * Loads `oxc-parser`, an optional peer dependency, the first time it is needed.
 * @returns The parser, or `null` if it isn't installed or can't be loaded.
 */
function loadOxc(): Oxc | null {
  if (oxc === undefined) {
    try {
      const parser = createRequire(import.meta.url)(
        'oxc-parser',
      ) as typeof OxcParser
      oxc = { parser, rawTransfer: parser.rawTransferSupported() }
    } catch {
      oxc = null
    }
  }
  return oxc
}

/**
 * Checks whether files can be parsed with `oxc-parser`.
 * @returns `true` if `oxc-parser` is installed.
 */
export function canParseWithOxc(): boolean {
  return loadOxc() !== null
}

/**
 * Parses a file with `oxc-parser`, which is faster than the parsers ESLint uses and doesn't depend
 * on the linter providing one, and analyzes its scopes the way `@typescript-eslint/parser` does.
 * @param filePath - The file's absolute path, whose extension sets the language.
 * @param text - The contents of the file.
 * @param parserOptions - The options of the parser of the file being linted.
 * @returns The parsed file, or `null` if `oxc-parser` isn't installed or the file has syntax errors.
 */
export function parseWithOxc(
  filePath: string,
  text: string,
  parserOptions: Record<string, unknown>,
): OxcParseResult | null {
  const loaded = loadOxc()
  if (loaded === null) {
    return null
  }
  const sourceType = parserOptions.sourceType === 'script' ? 'script' : 'module'
  try {
    const result = loaded.parser.parseSync(filePath, text, {
      astType: 'ts',
      sourceType,
      range: true,
      preserveParens: false,
      // Reads the AST from the parser's memory instead of deserializing it from JSON.
      experimentalRawTransfer: loaded.rawTransfer,
    } as OxcParser.ParserOptions)
    if (result.errors.length > 0) {
      return null
    }
    const ast = result.program as unknown as TSESTree.Program
    const ecmaFeatures = parserOptions.ecmaFeatures as
      | { globalReturn?: boolean }
      | undefined
    const scopeManager = analyze(ast, {
      globalReturn: ecmaFeatures?.globalReturn,
      jsxFragmentName:
        parserOptions.jsxFragmentName as AnalyzeOptions['jsxFragmentName'],
      jsxPragma: parserOptions.jsxPragma as AnalyzeOptions['jsxPragma'],
      lib: parserOptions.lib as AnalyzeOptions['lib'],
      sourceType,
    })
    return { ast, scopeManager, visitorKeys }
  } catch {
    return null
  }
}

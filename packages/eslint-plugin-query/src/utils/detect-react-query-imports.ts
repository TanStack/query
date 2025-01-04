import { TSESTree } from '@typescript-eslint/utils'
import type { ESLintUtils, TSESLint } from '@typescript-eslint/utils'

type Create = Parameters<
  ReturnType<typeof ESLintUtils.RuleCreator>
>[0]['create']

type Context = Parameters<Create>[0]
type Options = Parameters<Create>[1]
type Helpers = {
  isSpecificTanstackQueryImport: (
    node: TSESTree.Identifier,
    source: string,
  ) => boolean
  isTanstackQueryImport: (node: TSESTree.Identifier) => boolean
}

type EnhancedCreate = (
  context: Context,
  options: Options,
  helpers: Helpers,
) => ReturnType<Create>

export function detectTanstackQueryImports(create: EnhancedCreate): Create {
  return (context, optionsWithDefault) => {
    const tanstackQueryImportSpecifiers: Array<TSESTree.ImportClause> = []

    const helpers: Helpers = {
      isSpecificTanstackQueryImport(node, source) {
        return !!tanstackQueryImportSpecifiers.find((specifier) => {
          if (
            specifier.type === TSESTree.AST_NODE_TYPES.ImportSpecifier &&
            specifier.parent.type ===
              TSESTree.AST_NODE_TYPES.ImportDeclaration &&
            specifier.parent.source.value === source
          ) {
            return node.name === specifier.local.name
          }

          return false
        })
      },
      isTanstackQueryImport(node) {
        return !!tanstackQueryImportSpecifiers.find((specifier) => {
          if (specifier.type === TSESTree.AST_NODE_TYPES.ImportSpecifier) {
            return node.name === specifier.local.name
          }

          return false
        })
      },
    }

    const detectionInstructions: TSESLint.RuleListener = {
      ImportDeclaration(node) {
        if (
          node.specifiers.length > 0 &&
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          (node.importKind === 'value' || node.importKind === undefined) &&
          node.source.value.startsWith('@tanstack/') &&
          node.source.value.endsWith('-query')
        ) {
          tanstackQueryImportSpecifiers.push(...node.specifiers)
        }
      },
    }

    // Call original rule definition
    const ruleInstructions = create(context, optionsWithDefault, helpers)
    const enhancedRuleInstructions: TSESLint.RuleListener = {}

    const allKeys = new Set(
      Object.keys(detectionInstructions).concat(Object.keys(ruleInstructions)),
    )

    // Iterate over ALL instructions keys so we can override original rule instructions
    // to prevent their execution if conditions to report errors are not met.
    allKeys.forEach((instruction) => {
      enhancedRuleInstructions[instruction] = (node) => {
        if (instruction in detectionInstructions) {
          detectionInstructions[instruction]?.(node)
        }

        const ruleInstruction = ruleInstructions[instruction]

        // TODO: canReportErrors()
        if (ruleInstruction) {
          return ruleInstruction(node)
        }

        return undefined
      }
    })

    return enhancedRuleInstructions
  }
}

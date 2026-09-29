import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type {
  ParserServices,
  ParserServicesWithTypeInformation,
  TSESTree,
} from '@typescript-eslint/utils'

type TypeChecker = ReturnType<
  ParserServicesWithTypeInformation['program']['getTypeChecker']
>
type Type = ReturnType<TypeChecker['getTypeAtLocation']>

const QUERY_RESULT_TYPE_NAMES = new Set([
  'UseBaseQueryResult',
  'UseQueryResult',
  'UseSuspenseQueryResult',
  'DefinedUseQueryResult',
  'UseInfiniteQueryResult',
  'UseSuspenseInfiniteQueryResult',
  'DefinedUseInfiniteQueryResult',
  'QueryObserverResult',
  'InfiniteQueryObserverResult',
])

function isQueryResultType(type: Type): boolean {
  if (type.aliasSymbol && QUERY_RESULT_TYPE_NAMES.has(type.aliasSymbol.name)) {
    return true
  }
  const symbol = type.getSymbol()
  if (symbol && QUERY_RESULT_TYPE_NAMES.has(symbol.name)) {
    return true
  }
  return type.isUnion() && type.types.some(isQueryResultType)
}

export const NoRestDestructuringUtils = {
  isObjectRestDestructuring(node: TSESTree.Node): boolean {
    if (node.type !== AST_NODE_TYPES.ObjectPattern) {
      return false
    }
    return node.properties.some((p) => p.type === AST_NODE_TYPES.RestElement)
  },
  isQueryResultCall(
    node: TSESTree.CallExpression,
    parserServices: Partial<ParserServices> | null | undefined,
  ): boolean {
    if (!parserServices?.program || !parserServices.esTreeNodeToTSNodeMap) {
      return false
    }
    const checker = parserServices.program.getTypeChecker()
    const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node.callee)
    const signatures = checker.getTypeAtLocation(tsNode).getCallSignatures()
    return signatures.some((sig) => isQueryResultType(sig.getReturnType()))
  },
}

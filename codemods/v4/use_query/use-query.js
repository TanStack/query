// eslint-disable-next-line @typescript-eslint/no-var-requires
const createUtilsObject = require('../utils')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const createKeyReplacer = require('../utils/replacers/key-replacer')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const hookCallTransformer = require('../utils/transformers/hook-call-transformer')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const queryClientTransformer = require('../utils/transformers/query-client-transformer')

const transformQueryClientUsages = ({ jscodeshift, utils, root }) => {
  const transformer = queryClientTransformer({ jscodeshift, utils, root })
  const replacer = createKeyReplacer({ jscodeshift, root })

  // Not object syntax-aware methods.
  transformer.execute('getMutationDefaults', replacer)
  transformer.execute('getQueriesData', replacer)
  transformer.execute('getQueryData', replacer)
  transformer.execute('getQueryDefaults', replacer)
  transformer.execute('getQueryState', replacer)
  transformer.execute('isFetching', replacer)
  transformer.execute('setMutationDefaults', replacer)
  transformer.execute('setQueriesData', replacer)
  transformer.execute('setQueryData', replacer)
  transformer.execute('setQueryDefaults', replacer)
  // Object syntax-aware methods.
  transformer.execute('cancelQueries', replacer)
  transformer.execute('fetchInfiniteQuery', replacer)
  transformer.execute('fetchQuery', replacer)
  transformer.execute('invalidateQueries', replacer)
  transformer.execute('prefetchInfiniteQuery', replacer)
  transformer.execute('prefetchQuery', replacer)
  transformer.execute('refetchQueries', replacer)
  transformer.execute('removeQueries', replacer)
  transformer.execute('resetQueries', replacer)
}

const transformUseQueriesUsages = ({ jscodeshift, utils, root }) => {
  const transformer = hookCallTransformer({ jscodeshift, utils, root })
  const replacer = ({ node }) => {
    /**
     * When the node doesn't have the 'original' property, that means the codemod has been already applied,
     * so we don't need to do any changes.
     */
    if (!node.original) {
      return node
    }

    return jscodeshift.callExpression(node.original.callee, [
      jscodeshift.objectExpression([
        jscodeshift.property(
          'init',
          jscodeshift.identifier('queries'),
          node.original.arguments[0]
        ),
      ]),
    ])
  }

  transformer.execute('useQueries', replacer)
}

const transformUseQueryLikeUsages = ({ jscodeshift, utils, root }) => {
  const transformer = hookCallTransformer({ jscodeshift, utils, root })
  const queryKeyReplacer = createKeyReplacer({
    jscodeshift,
    root,
    keyName: 'queryKey',
  })
  const mutationKeyReplacer = createKeyReplacer({
    jscodeshift,
    root,
    keyName: 'mutationKey',
  })

  transformer.execute('useQuery', queryKeyReplacer)
  transformer.execute('useInfiniteQuery', queryKeyReplacer)
  transformer.execute('useIsFetching', queryKeyReplacer)
  transformer.execute('useIsMutating', queryKeyReplacer)
  transformer.execute('useMutation', mutationKeyReplacer)
}

module.exports = (file, api) => {
  const jscodeshift = api.jscodeshift
  const root = jscodeshift(file.source)

  const utils = createUtilsObject({ root, jscodeshift })

  // This function transforms usages like `useQuery` and `useMutation`.
  transformUseQueryLikeUsages({ jscodeshift, utils, root })
  // This function transforms usages of `useQueries`.
  transformUseQueriesUsages({ jscodeshift, utils, root })
  // This function transforms usages of `QueryClient`.
  transformQueryClientUsages({ jscodeshift, utils, root })

  return root.toSource({ quote: 'single' })
}

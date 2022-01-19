// eslint-disable-next-line @typescript-eslint/no-var-requires
const createUtilsObject = require('../utils')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const createKeyReplacer = require('../utils/replacers/key-replacer')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const hookCallTransformer = require('../utils/transformers/hook-call-transformer')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const queryClientTransformer = require('../utils/transformers/query-client-transformer')

const transformQueryClientUsages = ({
  jscodeshift,
  utils,
  root,
  queryKeyReplacer,
}) => {
  const transformer = queryClientTransformer({ jscodeshift, utils, root })

  // Not object syntax-aware methods.
  transformer.execute('getMutationDefaults', queryKeyReplacer)
  transformer.execute('getQueriesData', queryKeyReplacer)
  transformer.execute('getQueryData', queryKeyReplacer)
  transformer.execute('getQueryDefaults', queryKeyReplacer)
  transformer.execute('getQueryState', queryKeyReplacer)
  transformer.execute('isFetching', queryKeyReplacer)
  transformer.execute('setMutationDefaults', queryKeyReplacer)
  transformer.execute('setQueriesData', queryKeyReplacer)
  transformer.execute('setQueryData', queryKeyReplacer)
  transformer.execute('setQueryDefaults', queryKeyReplacer)
  // Object syntax-aware methods.
  transformer.execute('cancelQueries', queryKeyReplacer)
  transformer.execute('fetchInfiniteQuery', queryKeyReplacer)
  transformer.execute('fetchQuery', queryKeyReplacer)
  transformer.execute('invalidateQueries', queryKeyReplacer)
  transformer.execute('prefetchInfiniteQuery', queryKeyReplacer)
  transformer.execute('prefetchQuery', queryKeyReplacer)
  transformer.execute('refetchQueries', queryKeyReplacer)
  transformer.execute('removeQueries', queryKeyReplacer)
  transformer.execute('resetQueries', queryKeyReplacer)
}

const transformUseQueriesUsages = ({ jscodeshift, transformer }) => {
  transformer.execute('useQueries', ({ node }) => {
    // When the node doesn't have the 'original' property, that means the codemod has been already applied,
    // so we don't need to do any changes.
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
  })
}

const transformUseQueryLikeUsages = ({ transformer, hookCalls }) => {
  hookCalls.forEach(hookCall => {
    transformer.execute(hookCall.name, hookCall.replacer)
  })
}

module.exports = (file, api) => {
  const jscodeshift = api.jscodeshift
  const root = jscodeshift(file.source)

  const utils = createUtilsObject({ root, jscodeshift })
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
  const transformer = hookCallTransformer({ jscodeshift, utils, root })

  transformUseQueryLikeUsages({
    transformer,
    hookCalls: [
      { name: 'useQuery', replacer: queryKeyReplacer },
      { name: 'useInfiniteQuery', replacer: queryKeyReplacer },
      { name: 'useIsFetching', replacer: queryKeyReplacer },
      { name: 'useIsMutating', replacer: queryKeyReplacer },
      { name: 'useMutation', replacer: mutationKeyReplacer },
    ],
  })

  transformUseQueriesUsages({ jscodeshift, transformer })

  transformQueryClientUsages({ jscodeshift, utils, root, queryKeyReplacer })

  return root.toSource({ quote: 'single' })
}

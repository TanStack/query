// eslint-disable-next-line @typescript-eslint/no-var-requires
const createUtilsObject = require('./utils')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const createKeyReplacer = require('./utils/replacers/key-replacer')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const createUseQueryLikeTransformer = require('./utils/transformers/use-query-like-transformer')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const createQueryClientTransformer = require('./utils/transformers/query-client-transformer')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const createQueryCacheTransformer = require('./utils/transformers/query-cache-transformer')

const transformQueryClientUsages = ({ jscodeshift, utils, root, filePath }) => {
  const transformer = createQueryClientTransformer({ jscodeshift, utils, root })
  const replacer = createKeyReplacer({ jscodeshift, root, filePath })

  transformer.execute(
    [
      // Not object syntax-aware methods.
      'getMutationDefaults',
      'getQueriesData',
      'getQueryData',
      'getQueryDefaults',
      'getQueryState',
      'isFetching',
      'setMutationDefaults',
      'setQueriesData',
      'setQueryData',
      'setQueryDefaults',
      // Object syntax-aware methods.
      'cancelQueries',
      'fetchInfiniteQuery',
      'fetchQuery',
      'invalidateQueries',
      'prefetchInfiniteQuery',
      'prefetchQuery',
      'refetchQueries',
      'removeQueries',
      'resetQueries',
    ],
    replacer,
  )
}

const transformUseQueriesUsages = ({ jscodeshift, utils, root }) => {
  const transformer = createUseQueryLikeTransformer({
    jscodeshift,
    utils,
    root,
  })
  const replacer = ({ node }) => {
    /**
     * When the node doesn't have the 'original' property, that means the codemod has been already applied,
     * so we don't need to do any changes.
     */
    if (!node.original) {
      return node
    }

    const newCallExpression = jscodeshift.callExpression(node.original.callee, [
      jscodeshift.objectExpression([
        jscodeshift.property(
          'init',
          jscodeshift.identifier('queries'),
          node.original.arguments[0],
        ),
      ]),
    ])

    // TODO: This should be part of one function!
    if (node.typeParameters) {
      newCallExpression.typeArguments = node.typeParameters
    }

    return newCallExpression
  }

  transformer.execute(['useQueries'], replacer)
}

const transformUseQueryLikeUsages = ({
  jscodeshift,
  utils,
  root,
  filePath,
}) => {
  const transformer = createUseQueryLikeTransformer({
    jscodeshift,
    utils,
    root,
  })

  transformer.execute(
    ['useQuery', 'useInfiniteQuery', 'useIsFetching', 'useIsMutating'],
    createKeyReplacer({
      jscodeshift,
      root,
      filePath,
      keyName: 'queryKey',
    }),
  )
  transformer.execute(
    ['useMutation'],
    createKeyReplacer({
      jscodeshift,
      root,
      filePath,
      keyName: 'mutationKey',
    }),
  )
}

const transformQueryCacheUsages = ({ jscodeshift, utils, root, filePath }) => {
  const transformer = createQueryCacheTransformer({ jscodeshift, utils, root })
  const replacer = createKeyReplacer({ jscodeshift, root, filePath })

  transformer.execute(replacer)
}

module.exports = (file, api) => {
  const jscodeshift = api.jscodeshift
  const root = jscodeshift(file.source)

  // TODO: Execute the transformers only when it contains a `react-query` import!

  const utils = createUtilsObject({ root, jscodeshift })
  const filePath = file.path

  // This function transforms usages like `useQuery` and `useMutation`.
  transformUseQueryLikeUsages({ jscodeshift, utils, root, filePath })
  // This function transforms usages of `useQueries`.
  transformUseQueriesUsages({ jscodeshift, utils, root })
  // This function transforms usages of `QueryClient`.
  transformQueryClientUsages({ jscodeshift, utils, root, filePath })
  // This function transforms usages of `QueryCache`.
  transformQueryCacheUsages({ jscodeshift, utils, root, filePath })

  return root.toSource({ quote: 'single' })
}

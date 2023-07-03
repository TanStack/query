// eslint-disable-next-line @typescript-eslint/no-var-requires
const createUtilsObject = require('../../utils')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const transformFilterAwareUsages = require('./transformers/filter-aware-usage-transformer')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const transformQueryFnAwareUsages = require('./transformers/query-fn-aware-usage-transformer')

module.exports = (file, api) => {
  const jscodeshift = api.jscodeshift
  const root = jscodeshift(file.source)
  const utils = createUtilsObject({ root, jscodeshift })
  const filePath = file.path

  const dependencies = { jscodeshift, utils, root, filePath }

  transformFilterAwareUsages({
    ...dependencies,
    config: {
      keyName: 'queryKey',
      queryClientMethods: [
        'cancelQueries',
        'getQueriesData',
        'invalidateQueries',
        'isFetching',
        'refetchQueries',
        'removeQueries',
        'resetQueries',
        // 'setQueriesData',
      ],
      hooks: ['useIsFetching'],
    },
  })

  transformFilterAwareUsages({
    ...dependencies,
    config: {
      keyName: 'mutationKey',
      queryClientMethods: [],
      hooks: ['useIsMutating'],
    },
  })

  transformQueryFnAwareUsages({
    ...dependencies,
    config: {
      keyName: 'queryKey',
      queryClientMethods: [
        'ensureQueryData',
        'fetchQuery',
        'prefetchQuery',
        'fetchInfiniteQuery',
        'prefetchInfiniteQuery',
      ],
      hooks: [],
    },
  })

  return root.toSource({ quote: 'single', lineTerminator: '\n' })
}

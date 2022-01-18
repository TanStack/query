// eslint-disable-next-line @typescript-eslint/no-var-requires
const createUtilsObject = require('../utils')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const createKeyReplacer = require('../utils/replacers/key-replacer')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const queryClientTransformer = require('../utils/transformers/query-client-transformer')

module.exports = (file, api) => {
  const jscodeshift = api.jscodeshift
  const root = jscodeshift(file.source)

  const utils = createUtilsObject({ root, jscodeshift })
  const replacer = createKeyReplacer({ jscodeshift, root })
  const transformer = queryClientTransformer({ jscodeshift, utils, root })

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

  return root.toSource({ quote: 'single' })
}

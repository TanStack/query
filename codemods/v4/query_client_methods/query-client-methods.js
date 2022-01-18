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

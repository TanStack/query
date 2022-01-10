// eslint-disable-next-line @typescript-eslint/no-var-requires
const createUtilsObject = require('../utils')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const createQueryKeyReplacer = require('../utils/replacers/query-key-replacer')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const queryClientTransformer = require('../utils/transformers/query-client-transformer')

module.exports = (file, api) => {
  const jscodeshift = api.jscodeshift
  const root = jscodeshift(file.source)

  const utils = createUtilsObject({ root, jscodeshift })
  const replacer = createQueryKeyReplacer({ jscodeshift, root })
  const transformer = queryClientTransformer({ jscodeshift, utils, root })

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

  return root.toSource({ quote: 'single' })
}

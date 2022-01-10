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

  transformer.execute('cancelQueries', replacer)
  transformer.execute('invalidateQueries', replacer)
  transformer.execute('refetchQueries', replacer)
  transformer.execute('removeQueries', replacer)
  transformer.execute('resetQueries', replacer)

  return root.toSource({ quote: 'single' })
}

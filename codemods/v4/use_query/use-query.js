// eslint-disable-next-line @typescript-eslint/no-var-requires
const createUtilsObject = require('../utils')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const createKeyReplacer = require('../utils/replacers/key-replacer')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const hookCallTransformer = require('../utils/transformers/hook-call-transformer')

module.exports = (file, api) => {
  const jscodeshift = api.jscodeshift
  const root = jscodeshift(file.source)

  const utils = createUtilsObject({ root, jscodeshift })
  const replacer = createKeyReplacer({ jscodeshift, root })
  const transformer = hookCallTransformer({ jscodeshift, utils, root })

  transformer.execute('useQuery', replacer)
  transformer.execute('useInfiniteQuery', replacer)

  return root.toSource({ quote: 'single' })
}

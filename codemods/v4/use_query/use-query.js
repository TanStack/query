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
  const queryKeyReplacer = createKeyReplacer({ jscodeshift, root })
  const mutationKeyReplacer = createKeyReplacer({
    jscodeshift,
    root,
    keyName: 'mutationKey',
  })
  const transformer = hookCallTransformer({ jscodeshift, utils, root })

  transformer.execute('useQuery', queryKeyReplacer)
  transformer.execute('useInfiniteQuery', queryKeyReplacer)
  transformer.execute('useMutation', mutationKeyReplacer)

  return root.toSource({ quote: 'single' })
}

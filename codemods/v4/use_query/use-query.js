// eslint-disable-next-line @typescript-eslint/no-var-requires
const createUtilsObject = require('../utils')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const createKeyReplacer = require('../utils/replacers/key-replacer')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const hookCallTransformer = require('../utils/transformers/hook-call-transformer')

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
  transformer.execute('useIsFetching', queryKeyReplacer)
  transformer.execute('useIsMutating', queryKeyReplacer)
  transformer.execute('useMutation', mutationKeyReplacer)

  transformUseQueriesUsages({ jscodeshift, transformer })

  return root.toSource({ quote: 'single' })
}

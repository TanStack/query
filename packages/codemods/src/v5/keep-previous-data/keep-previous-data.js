// eslint-disable-next-line @typescript-eslint/no-var-requires
const createUtilsObject = require('../../utils')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const createUseQueryLikeTransformer = require('../../utils/transformers/use-query-like-transformer')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const AlreadyHasPlaceholderDataProperty = require('./utils/already-has-placeholder-data-property')

/**
 * @param {import('jscodeshift')} jscodeshift
 * @param {Object} utils
 * @param {import('jscodeshift').Collection} root
 * @param {string} filePath
 * @param {{keyName: "mutationKey"|"queryKey", queryClientMethods: ReadonlyArray<string>, hooks: ReadonlyArray<string>}} config
 */
const transformUsages = ({ jscodeshift, utils, root, filePath, config }) => {
  /**
   * @param {import('jscodeshift').ObjectExpression} objectExpression
   * @returns {Array<import('jscodeshift').ObjectProperty>}
   */
  const filterKeepPreviousDataProperty = (objectExpression) => {
    return objectExpression.properties.filter((property) => {
      return !jscodeshift.match(property.key, {
        type: jscodeshift.Identifier.name,
        name: 'keepPreviousData',
      })
    })
  }

  const createPlaceholderDataObjectProperty = () => {
    return jscodeshift.objectProperty(
      jscodeshift.identifier('placeholderData'),
      jscodeshift.identifier('keepPreviousData'),
    )
  }

  /**
   * @param {import('jscodeshift').ObjectExpression} objectExpression
   * @param {string} propertyName
   * @returns {boolean}
   */
  const hasObjectProperty = (objectExpression, propertyName) => {
    return (
      objectExpression.properties.findIndex((property) => {
        return jscodeshift.match(property.key, {
          type: jscodeshift.Identifier.name,
          name: propertyName,
        })
      }) !== -1
    )
  }

  /**
   * @param {import('jscodeshift').ObjectExpression} objectExpression
   * @returns {boolean}
   */
  const hasPlaceholderDataProperty = (objectExpression) => {
    return hasObjectProperty(objectExpression, 'placeholderData')
  }

  /**
   * @param {import('jscodeshift').ObjectExpression} objectExpression
   * @returns {boolean}
   */
  const hasKeepPreviousDataProperty = (objectExpression) => {
    return hasObjectProperty(objectExpression, 'keepPreviousData')
  }

  let isKeepPreviousDataInUse = false

  const replacer = (path) => {
    const node = path.node
    const functionArguments = []

    try {
      const firstArgument = node.arguments[0] ?? null

      if (
        firstArgument &&
        utils.isObjectExpression(firstArgument) &&
        hasKeepPreviousDataProperty(firstArgument)
      ) {
        if (hasPlaceholderDataProperty(firstArgument)) {
          throw new AlreadyHasPlaceholderDataProperty(node, filePath)
        }

        const filteredProperties = filterKeepPreviousDataProperty(firstArgument)

        functionArguments.push(
          jscodeshift.objectExpression([
            ...filteredProperties,
            createPlaceholderDataObjectProperty(),
          ]),
        )
      }

      isKeepPreviousDataInUse = true

      return jscodeshift.callExpression(node.original.callee, functionArguments)
    } catch (error) {
      utils.warn(
        error.name === AlreadyHasPlaceholderDataProperty.name
          ? error.message
          : `An unknown error occurred while processing the "${filePath}" file. Please review this file, because the codemod couldn't be applied.`,
      )

      return node
    }
  }

  createUseQueryLikeTransformer({ jscodeshift, utils, root }).execute(
    config.hooks,
    replacer,
  )

  return { isKeepPreviousDataInUse }
}

module.exports = (file, api) => {
  const jscodeshift = api.jscodeshift
  const root = jscodeshift(file.source)
  const utils = createUtilsObject({ root, jscodeshift })
  const filePath = file.path

  const dependencies = { jscodeshift, utils, root, filePath }

  const { isKeepPreviousDataInUse } = transformUsages({
    ...dependencies,
    config: {
      hooks: ['useInfiniteQuery', 'useQueries', 'useQuery'],
    },
  })

  if (isKeepPreviousDataInUse) {
    root
      .find(jscodeshift.ImportDeclaration, {
        source: {
          value: '@tanstack/react-query',
        },
      })
      .replaceWith(({ node: mutableNode }) => {
        mutableNode.specifiers = [
          jscodeshift.importSpecifier(
            jscodeshift.identifier('keepPreviousData'),
          ),
          ...mutableNode.specifiers,
        ]

        return mutableNode
      })
  }

  return root.toSource({ quote: 'single', lineTerminator: '\n' })
}

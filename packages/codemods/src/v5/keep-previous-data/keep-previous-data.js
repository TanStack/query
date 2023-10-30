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
   * @param {import('jscodeshift').CallExpression} callExpression
   * @returns {{start: number, end: number}}
   */
  const getCallExpressionLocation = (callExpression) => {
    const location = callExpression.callee.loc
    const start = location.start.line
    const end = location.end.line

    return { start, end }
  }

  /**
   * @param {import('jscodeshift').ObjectProperty} objectProperty
   * @returns {boolean}
   */
  const isKeepPreviousDataObjectProperty = (objectProperty) => {
    return jscodeshift.match(objectProperty.key, {
      type: jscodeshift.Identifier.name,
      name: 'keepPreviousData',
    })
  }

  /**
   * @param {import('jscodeshift').ObjectProperty} objectProperty
   * @returns {boolean}
   */
  const isObjectPropertyHasTrueBooleanLiteralValue = (objectProperty) => {
    return jscodeshift.match(objectProperty.value, {
      type: jscodeshift.BooleanLiteral.name,
      value: true,
    })
  }

  /**
   * @param {import('jscodeshift').ObjectExpression} objectExpression
   * @returns {Array<import('jscodeshift').ObjectProperty>}
   */
  const filterKeepPreviousDataProperty = (objectExpression) => {
    return objectExpression.properties.filter((objectProperty) => {
      return !isKeepPreviousDataObjectProperty(objectProperty)
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
   * @returns {boolean}
   */
  const hasPlaceholderDataProperty = (objectExpression) => {
    return (
      objectExpression.properties.findIndex((objectProperty) => {
        return jscodeshift.match(objectProperty.key, {
          type: jscodeshift.Identifier.name,
          name: 'placeholderData',
        })
      }) !== -1
    )
  }

  /**
   * @param {import('jscodeshift').ObjectExpression} objectExpression
   * @returns {import('jscodeshift').ObjectProperty | undefined}
   */
  const getKeepPreviousDataProperty = (objectExpression) => {
    return objectExpression.properties.find(isKeepPreviousDataObjectProperty)
  }

  let isKeepPreviousDataInUse = false

  const replacer = (path) => {
    const node = path.node
    const functionArguments = []
    const { start, end } = getCallExpressionLocation(node)

    try {
      const firstArgument = node.arguments[0] ?? null

      if (firstArgument && utils.isObjectExpression(firstArgument)) {
        const isPlaceholderDataPropertyPresent =
          hasPlaceholderDataProperty(firstArgument)

        if (hasPlaceholderDataProperty(firstArgument)) {
          throw new AlreadyHasPlaceholderDataProperty(node, filePath)
        }

        const keepPreviousDataProperty =
          getKeepPreviousDataProperty(firstArgument)

        const keepPreviousDataPropertyHasTrueValue =
          isObjectPropertyHasTrueBooleanLiteralValue(keepPreviousDataProperty)

        if (!keepPreviousDataPropertyHasTrueValue) {
          utils.warn(
            `The usage in file "${filePath}" at line ${start}:${end} already contains a "keepPreviousData" property but its value is not "true". Please migrate this usage manually.`,
          )

          return node
        }

        if (keepPreviousDataPropertyHasTrueValue) {
          // Removing the `keepPreviousData` property from the object.
          const mutableObjectExpressionProperties =
            filterKeepPreviousDataProperty(firstArgument)

          if (!isPlaceholderDataPropertyPresent) {
            isKeepPreviousDataInUse = true

            // When the `placeholderData` property is not present, the `placeholderData: keepPreviousData` property will be added.
            mutableObjectExpressionProperties.push(
              createPlaceholderDataObjectProperty(),
            )
          }

          functionArguments.push(
            jscodeshift.objectExpression(mutableObjectExpressionProperties),
          )

          return jscodeshift.callExpression(
            node.original.callee,
            functionArguments,
          )
        }
      }

      utils.warn(
        `The usage in file "${filePath}" at line ${start}:${end} could not be transformed, because the first parameter is not an object expression. Please migrate this usage manually.`,
      )

      return node

      return node
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

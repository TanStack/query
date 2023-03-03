// eslint-disable-next-line @typescript-eslint/no-var-requires
const createV5UtilsObject = require('../utils')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const UnknownUsageError = require('../utils/unknown-usage-error')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const createQueryClientTransformer = require('../../../utils/transformers/query-client-transformer')

/**
 *
 * @param {import('jscodeshift')} jscodeshift
 * @param {Object} utils
 * @param {import('jscodeshift').Collection} root
 * @param {string} filePath
 * @param {{keyName: "mutationKey"|"queryKey", queryClientMethods: ReadonlyArray<string>, hooks: ReadonlyArray<string>}} config
 */
const transformQueryFnAwareUsages = ({
  jscodeshift,
  utils,
  root,
  filePath,
  config,
}) => {
  const v5Utils = createV5UtilsObject({ jscodeshift, utils })

  /**
   * @param {import('jscodeshift').CallExpression} node
   * @returns {boolean}
   */
  const canSkipReplacement = (node) => {
    const callArguments = node.arguments

    const hasKeyProperty = () =>
      callArguments[0].properties.some(
        (property) =>
          utils.isObjectProperty(property) &&
          [config.keyName, 'queryFn'].includes(property.key.name),
      )

    return (
      callArguments.length > 0 &&
      utils.isObjectExpression(callArguments[0]) &&
      hasKeyProperty()
    )
  }

  const isFunctionDefinition = (node) => {
    const isArrowFunctionExpression = jscodeshift.match(node, {
      type: jscodeshift.ArrowFunctionExpression.name,
    })
    const isFunctionExpression = jscodeshift.match(node, {
      type: jscodeshift.FunctionExpression.name,
    })

    return isArrowFunctionExpression || isFunctionExpression
  }

  const predicate = (property) => {
    const isSpreadElement = jscodeshift.match(property, {
      type: jscodeshift.SpreadElement.name,
    })
    const isObjectProperty = utils.isObjectProperty(property)

    return (
      isSpreadElement ||
      (isObjectProperty && property.key.name !== config.keyName)
    )
  }

  const myFnQueryFn = (path, node) => {
    if (isFunctionDefinition(node)) {
      return jscodeshift.property(
        'init',
        jscodeshift.identifier('queryFn'),
        node,
      )
    }

    if (utils.isIdentifier(node)) {
      const binding = v5Utils.getBindingFromScope(path, node.name)

      if (!binding) {
        throw new UnknownUsageError(path.node, filePath)
      }

      const isVariableDeclaration = jscodeshift.match(binding, {
        type: jscodeshift.VariableDeclarator.name,
      })

      if (!isVariableDeclaration) {
        return undefined
      }

      const isTSAsExpression = jscodeshift.match(binding.init, {
        type: jscodeshift.TSAsExpression.name,
      })
      const initializer = isTSAsExpression
        ? binding.init.expression
        : binding.init

      if (isFunctionDefinition(initializer)) {
        return jscodeshift.property(
          'init',
          jscodeshift.identifier('queryFn'),
          binding.id,
        )
      }
    }

    return undefined
  }

  const replacer = (path) => {
    const node = path.node

    try {
      // If the given method/function call matches certain criteria, the node doesn't need to be replaced, this step can be skipped.
      if (canSkipReplacement(node)) {
        return node
      }

      const keyProperty = v5Utils.transformArgumentToKey(
        path,
        node.arguments[0],
        config.keyName,
        filePath,
      )

      if (!keyProperty) {
        throw new UnknownUsageError(node, filePath)
      }

      const parameters = [jscodeshift.objectExpression([keyProperty])]
      const targetObject = parameters[0]
      const secondParameter = node.arguments[1]

      if (secondParameter) {
        const queryFnProperty = myFnQueryFn(path, secondParameter)

        if (queryFnProperty) {
          targetObject.properties.push(queryFnProperty)

          const thirdParameter = node.arguments[2]

          if (utils.isObjectExpression(thirdParameter)) {
            v5Utils.copyPropertiesFromSource(
              thirdParameter,
              targetObject,
              predicate,
            )
          } else {
            targetObject.properties.push(
              jscodeshift.spreadElement(thirdParameter),
            )
          }

          return jscodeshift.callExpression(node.original.callee, parameters)
        }

        if (utils.isObjectExpression(secondParameter)) {
          v5Utils.copyPropertiesFromSource(
            secondParameter,
            targetObject,
            predicate,
          )
        }

        return jscodeshift.callExpression(node.original.callee, parameters)
      }

      return jscodeshift.callExpression(node.original.callee, parameters)
    } catch (error) {
      utils.warn(
        error.name === UnknownUsageError.name
          ? error.message
          : `An unknown error occurred while processing the "${filePath}" file. Please review this file, because the codemod couldn't be applied.`,
      )

      return node
    }
  }

  createQueryClientTransformer({ jscodeshift, utils, root }).execute(
    config.queryClientMethods,
    replacer,
  )
}

module.exports = transformQueryFnAwareUsages

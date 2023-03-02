// eslint-disable-next-line @typescript-eslint/no-var-requires
const createUtilsObject = require('../../utils')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const createUseQueryLikeTransformer = require('../../utils/transformers/use-query-like-transformer')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const createQueryClientTransformer = require('../../utils/transformers/query-client-transformer')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const createQueryCacheTransformer = require('../../utils/transformers/query-cache-transformer')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const UnknownUsageError = require('./utils/unknown-usage-error')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const createV5UtilsObject = require('./utils')

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

/**
 *
 * @param {import('jscodeshift')} jscodeshift
 * @param {Object} utils
 * @param {import('jscodeshift').Collection} root
 * @param {string} filePath
 * @param {{keyName: "mutationKey"|"queryKey", queryClientMethods: ReadonlyArray<string>, hooks: ReadonlyArray<string>}} config
 */
const transformFilterAwareUsages = ({
  jscodeshift,
  utils,
  root,
  filePath,
  config,
}) => {
  const v5Utils = createV5UtilsObject({ jscodeshift, utils })

  /**
   * @param {import('jscodeshift').CallExpression} node
   * @param {"mutationKey"|"queryKey"} keyName
   * @returns {boolean}
   */
  const canSkipReplacement = (node, keyName) => {
    const callArguments = node.arguments

    const hasKeyProperty = () =>
      callArguments[0].properties.some(
        (property) =>
          utils.isObjectProperty(property) && property.key.name !== keyName,
      )

    /**
     * This call has only one argument, which is an object expression. According to the new signature, this is a
     * valid use case, so code changes are not needed.
     */
    return (
      callArguments.length > 0 &&
      utils.isObjectExpression(callArguments[0]) &&
      hasKeyProperty()
    )
  }

  const replacer = (path) => {
    const node = path.node

    try {
      // If the given method/function call matches certain criteria, the node doesn't need to be replaced, this step can be skipped.
      if (canSkipReplacement(node, config.keyName)) {
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
      const secondParameter = node.arguments[1]

      if (secondParameter) {
        // If it has a second argument, and it's an object, then we get the properties of it, because it will be part of the
        // first argument, otherwise we use an empty array, because we can spread it during the objectExpression creation.
        if (utils.isObjectExpression(secondParameter)) {
          secondParameter.properties.forEach((property) => {
            const isSpreadElement = jscodeshift.match(property, {
              type: jscodeshift.SpreadElement.name,
            })
            const isObjectProperty = utils.isObjectProperty(property)

            if (
              isSpreadElement ||
              (isObjectProperty && property.key.name !== config.keyName)
            ) {
              parameters[0].properties.push(property)
            }
          })
        } else {
          parameters[0].properties.push(
            jscodeshift.spreadElement(secondParameter),
          )
        }
      }

      // The rest of the parameters can be simply pushed to the parameters object so all will be kept.
      parameters.push(...node.arguments.slice(2))

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

  createUseQueryLikeTransformer({ jscodeshift, utils, root }).execute(
    config.hooks,
    replacer,
  )

  createQueryCacheTransformer({ jscodeshift, utils, root }).execute(replacer)
}

module.exports = (file, api) => {
  const jscodeshift = api.jscodeshift
  const root = jscodeshift(file.source)
  const utils = createUtilsObject({ root, jscodeshift })
  const filePath = file.path

  const dependencies = { jscodeshift, utils, root, filePath }

  transformFilterAwareUsages({
    ...dependencies,
    config: {
      keyName: 'queryKey',
      queryClientMethods: [
        'cancelQueries',
        'getQueriesData',
        'invalidateQueries',
        'isFetching',
        'refetchQueries',
        'removeQueries',
        'resetQueries',
        // 'setQueriesData',
      ],
      hooks: ['useIsFetching'],
    },
  })

  transformFilterAwareUsages({
    ...dependencies,
    config: {
      keyName: 'mutationKey',
      queryClientMethods: [],
      hooks: ['useIsMutating'],
    },
  })

  transformQueryFnAwareUsages({
    ...dependencies,
    config: {
      keyName: 'queryKey',
      queryClientMethods: [
        'ensureQueryData',
        'fetchQuery',
        'prefetchQuery',
        'fetchInfiniteQuery',
        'prefetchInfiniteQuery',
      ],
      hooks: [],
    },
  })

  return root.toSource({ quote: 'single' })
}

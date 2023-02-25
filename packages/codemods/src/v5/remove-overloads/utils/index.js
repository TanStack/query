// eslint-disable-next-line @typescript-eslint/no-var-requires
const UnknownUsageError = require('./unknown-usage-error')

module.exports = ({ jscodeshift, utils }) => {
  /**
   * @param {import('jscodeshift').NodePath} path
   * @param {string} argumentName
   * @returns {*}
   */
  const getBindingFromScope = (path, argumentName) => {
    /**
     * If the current scope contains the declaration then we can use the actual one else we attempt to find the
     * binding from above.
     */
    const scope = path.scope.declares(argumentName)
      ? path.scope
      : path.scope.lookup(argumentName)

    /**
     * The declaration couldn't be found for some reason, time to move on. We warn the user it needs to be rewritten
     * by themselves.
     */
    if (!scope) {
      return undefined
    }

    return scope.bindings[argumentName]
      .filter((item) => utils.isIdentifier(item.value))
      .map((item) => item.parentPath.value)
      .at(0)
  }

  /**
   * @param {import('jscodeshift').Node} node
   * @returns {boolean}
   */
  const isArrayExpressionVariable = (node) =>
    jscodeshift.match(node, {
      type: jscodeshift.VariableDeclarator.name,
      init: {
        type: jscodeshift.ArrayExpression.name,
      },
    })

  /**
   * @param {import('jscodeshift').NodePath} path
   * @param {import('jscodeshift').Node} node
   * @param {"queryKey"|"mutationKey"} keyName
   * @param {string} filePath
   * @returns {import('jscodeshift').Property|undefined}
   */
  const transformArgumentToKey = (path, node, keyName, filePath) => {
    // If the first argument is an identifier we have to infer its type if possible.
    if (utils.isIdentifier(node)) {
      const binding = getBindingFromScope(path, node.name)

      if (!binding) {
        throw new UnknownUsageError(path.node, filePath)
      }

      if (isArrayExpressionVariable(binding)) {
        return jscodeshift.property(
          'init',
          jscodeshift.identifier(keyName),
          jscodeshift.identifier(binding.id.name),
        )
      }
    }

    // If the first argument is an array, then it matches the following overload:
    // methodName(queryKey?: QueryKey, firstObject?: TFirstObject, secondObject?: TSecondObject)
    if (utils.isArrayExpression(node)) {
      // Then we create the 'queryKey' property based on it, because it will be passed to the first argument
      // that should be an object according to the new signature.
      return jscodeshift.property('init', jscodeshift.identifier(keyName), node)
    }

    return undefined
  }

  return {
    transformArgumentToKey,
  }
}

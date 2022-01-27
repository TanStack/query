module.exports = ({ jscodeshift, utils, root }) => {
  const isCallExpression = node =>
    jscodeshift.match(node, { type: jscodeshift.CallExpression.name })

  const isIdentifier = node =>
    jscodeshift.match(node, { type: jscodeshift.Identifier.name })

  const isNewExpression = node =>
    jscodeshift.match(node, { type: jscodeshift.NewExpression.name })

  const isMemberExpression = node =>
    jscodeshift.match(node, { type: jscodeshift.MemberExpression.name })

  const isClassInstantiationOf = (node, className) =>
    isNewExpression(node) &&
    isIdentifier(node.callee) &&
    node.callee.name === className

  const isFunctionCallOf = (node, functionName) =>
    isCallExpression(node) &&
    isIdentifier(node.callee) &&
    node.callee.name === functionName

  const isGetQueryCacheMethodCall = (initializer, knownQueryClientIds) => {
    const isKnownQueryClient = node =>
      isIdentifier(node) && knownQueryClientIds.includes(node.name)

    const isGetQueryCacheIdentifier = node =>
      jscodeshift.match(node, { type: jscodeshift.Identifier.name }) &&
      node.name === 'getQueryCache'

    const isValidInitializer = node =>
      isCallExpression(node) && isMemberExpression(node.callee)

    if (isValidInitializer(initializer)) {
      const instance = initializer.callee.object
      const hasValidSomething =
        isKnownQueryClient(instance) ||
        isFunctionCallOf(instance, 'useQueryClient')

      return (
        isGetQueryCacheIdentifier(initializer.callee.property) &&
        hasValidSomething
      )
    }

    return false
  }

  const findQueryClientInstantiations = () =>
    root.find(jscodeshift.VariableDeclarator, {}).filter(node => {
      if (node.value.init) {
        const initializer = node.value.init

        return (
          isClassInstantiationOf(initializer, 'QueryClient') ||
          isFunctionCallOf(initializer, 'useQueryClient')
        )
      }

      return false
    })

  const findQueryCacheInstantiations = knownQueryClientIds => {
    return root.find(jscodeshift.VariableDeclarator, {}).filter(node => {
      if (node.value.init) {
        const initializer = node.value.init

        return (
          isClassInstantiationOf(initializer, 'QueryCache') ||
          isGetQueryCacheMethodCall(initializer, knownQueryClientIds)
        )
      }

      return false
    })
  }

  const filterQueryCacheMethods = node =>
    isIdentifier(node) && ['find', 'findAll'].includes(node.name)

  const findQueryCacheCalls = () => {
    /**
     * Here we collect all query client instantiations. We have to make aware of them because the query cache can be
     * accessed by the query client as well.
     */
    const queryClientIdentifiers = findQueryClientInstantiations()
      .paths()
      .map(node => node.value.id.name)
    /**
     * Here we collect all query cache instantiations. The reason is simple: the methods can be called on query cache
     * instances, to locate the possible usages we need to be aware of the identifier names.
     */
    const queryCacheIdentifiers = findQueryCacheInstantiations(
      queryClientIdentifiers
    )
      .paths()
      .map(node => node.value.id.name)

    return (
      root
        // First, we need to find all method calls.
        .find(jscodeshift.CallExpression, {
          callee: {
            type: jscodeshift.MemberExpression.name,
            property: {
              type: jscodeshift.Identifier.name,
            },
          },
        })
        // Then we narrow the collection to all 'fetch' and 'fetchAll' methods.
        .filter(node => filterQueryCacheMethods(node.value.callee.property))
        .filter(node => {
          const object = node.value.callee.object

          if (isIdentifier(object)) {
            return queryCacheIdentifiers.includes(object.name)
          }

          if (isCallExpression(object)) {
            return isGetQueryCacheMethodCall(object, queryClientIdentifiers)
          }

          return false
        })
    )
  }

  const execute = replacer => {
    if (utils.findImportSpecifier('QueryCache').paths().length > 0) {
      findQueryCacheCalls().replaceWith(replacer)
    }
  }

  return {
    execute,
  }
}

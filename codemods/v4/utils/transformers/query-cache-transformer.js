module.exports = ({ jscodeshift, utils, root }) => {
  const isNewExpression = node =>
    jscodeshift.match(node, { type: jscodeshift.NewExpression.name })

  const isClassInstantiationOf = (node, selector) => {
    if (!isNewExpression(node)) {
      return false
    }

    const parts = selector.split('.')

    return parts.length === 1
      ? utils.isIdentifier(node.callee) && node.callee.name === parts[0]
      : utils.isMemberExpression(node.callee) &&
          node.callee.object.name === parts[0] &&
          node.callee.property.name === parts[1]
  }

  const isGetQueryCacheMethodCall = (
    initializer,
    importIdentifiers,
    knownQueryClientIds
  ) => {
    const isKnownQueryClient = node =>
      utils.isIdentifier(node) && knownQueryClientIds.includes(node.name)

    const isGetQueryCacheIdentifier = node =>
      jscodeshift.match(node, { type: jscodeshift.Identifier.name }) &&
      node.name === 'getQueryCache'

    const isValidInitializer = node =>
      utils.isCallExpression(node) && utils.isMemberExpression(node.callee)

    if (isValidInitializer(initializer)) {
      const instance = initializer.callee.object

      return (
        isGetQueryCacheIdentifier(initializer.callee.property) &&
        (isKnownQueryClient(instance) ||
          utils.isFunctionCallOf(
            instance,
            utils.getSelectorByImports(importIdentifiers, 'useQueryClient')
          ))
      )
    }

    return false
  }

  const findQueryClientInstantiations = importIdentifiers =>
    root.find(jscodeshift.VariableDeclarator, {}).filter(node => {
      if (node.value.init) {
        const initializer = node.value.init

        return (
          isClassInstantiationOf(
            initializer,
            utils.getSelectorByImports(importIdentifiers, 'QueryClient')
          ) ||
          utils.isFunctionCallOf(
            initializer,
            utils.getSelectorByImports(importIdentifiers, 'useQueryClient')
          )
        )
      }

      return false
    })

  const findQueryCacheInstantiations = (
    importIdentifiers,
    knownQueryClientIds
  ) =>
    root.find(jscodeshift.VariableDeclarator, {}).filter(node => {
      if (node.value.init) {
        const initializer = node.value.init

        return (
          isClassInstantiationOf(
            initializer,
            utils.getSelectorByImports(importIdentifiers, 'QueryCache')
          ) ||
          isGetQueryCacheMethodCall(
            initializer,
            importIdentifiers,
            knownQueryClientIds
          )
        )
      }

      return false
    })

  const filterQueryCacheMethods = node =>
    utils.isIdentifier(node) && ['find', 'findAll'].includes(node.name)

  const findQueryCacheCalls = importIdentifiers => {
    /**
     * Here we collect all query client instantiations. We have to make aware of them because the query cache can be
     * accessed by the query client as well.
     */
    const queryClientIdentifiers = findQueryClientInstantiations(
      importIdentifiers
    )
      .paths()
      .map(node => node.value.id.name)
    /**
     * Here we collect all query cache instantiations. The reason is simple: the methods can be called on query cache
     * instances, to locate the possible usages we need to be aware of the identifier names.
     */
    const queryCacheIdentifiers = findQueryCacheInstantiations(
      importIdentifiers,
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

          if (utils.isIdentifier(object)) {
            return queryCacheIdentifiers.includes(object.name)
          }

          if (utils.isCallExpression(object)) {
            return isGetQueryCacheMethodCall(
              object,
              importIdentifiers,
              queryClientIdentifiers
            )
          }

          return false
        })
    )
  }

  const execute = replacer => {
    findQueryCacheCalls(
      utils.locateImports(['QueryCache', 'QueryClient', 'useQueryClient'])
    ).replaceWith(replacer)
  }

  return {
    execute,
  }
}

module.exports = ({ jscodeshift, utils, root }) => {
  const isCallExpression = node =>
    jscodeshift.match(node, { type: jscodeshift.CallExpression.name })

  const isIdentifier = node =>
    jscodeshift.match(node, { type: jscodeshift.Identifier.name })

  const isNewExpression = node =>
    jscodeshift.match(node, { type: jscodeshift.NewExpression.name })

  const isMemberExpression = node =>
    jscodeshift.match(node, { type: jscodeshift.MemberExpression.name })

  const isClassInstantiationOf = (node, selector) => {
    if (!isNewExpression(node)) {
      return false
    }

    const parts = selector.split('.')

    return parts.length === 1
      ? isIdentifier(node.callee) && node.callee.name === parts[0]
      : isMemberExpression(node.callee) &&
          node.callee.object.name === parts[0] &&
          node.callee.property.name === parts[1]
  }

  const isFunctionCallOf = (node, selector) => {
    if (!isCallExpression(node)) {
      return false
    }

    const parts = selector.split('.')

    return parts.length === 1
      ? isIdentifier(node.callee) && node.callee.name === parts[0]
      : isMemberExpression(node.callee) &&
          node.callee.object.name === parts[0] &&
          node.callee.property.name === parts[1]
  }

  const getSelectorByImports = (imports, path) =>
    imports.namespace
      ? `${imports.namespace.name}.${imports[path].name}`
      : imports[path].name

  const isGetQueryCacheMethodCall = (
    initializer,
    importIdentifiers,
    knownQueryClientIds
  ) => {
    const isKnownQueryClient = node =>
      isIdentifier(node) && knownQueryClientIds.includes(node.name)

    const isGetQueryCacheIdentifier = node =>
      jscodeshift.match(node, { type: jscodeshift.Identifier.name }) &&
      node.name === 'getQueryCache'

    const isValidInitializer = node =>
      isCallExpression(node) && isMemberExpression(node.callee)

    if (isValidInitializer(initializer)) {
      const instance = initializer.callee.object

      return (
        isGetQueryCacheIdentifier(initializer.callee.property) &&
        (isKnownQueryClient(instance) ||
          isFunctionCallOf(
            instance,
            getSelectorByImports(importIdentifiers, 'useQueryClient')
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
            getSelectorByImports(importIdentifiers, 'QueryClient')
          ) ||
          isFunctionCallOf(
            initializer,
            getSelectorByImports(importIdentifiers, 'useQueryClient')
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
            getSelectorByImports(importIdentifiers, 'QueryCache')
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
    isIdentifier(node) && ['find', 'findAll'].includes(node.name)

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

          if (isIdentifier(object)) {
            return queryCacheIdentifiers.includes(object.name)
          }

          if (isCallExpression(object)) {
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

  const findImportIdentifierOf = name => {
    const specifier = utils.findImportSpecifier(name).paths()

    if (specifier.length > 0) {
      return specifier[0].value.local
    }

    return jscodeshift.identifier(name)
  }

  const findNamespaceImportIdentifier = () => {
    const specifier = utils.findNamespacedImportSpecifiers().paths()

    return specifier.length > 0 ? specifier[0].value.local : null
  }

  const locateImports = () => {
    const namespaceIdentifier = findNamespaceImportIdentifier()

    if (namespaceIdentifier) {
      return {
        namespace: namespaceIdentifier,
        QueryCache: jscodeshift.identifier('QueryCache'),
        QueryClient: jscodeshift.identifier('QueryClient'),
        useQueryClient: jscodeshift.identifier('useQueryClient'),
      }
    }

    return {
      namespace: null,
      QueryCache: findImportIdentifierOf('QueryCache'),
      QueryClient: findImportIdentifierOf('QueryClient'),
      useQueryClient: findImportIdentifierOf('useQueryClient'),
    }
  }

  const execute = replacer => {
    findQueryCacheCalls(locateImports()).replaceWith(replacer)
  }

  return {
    execute,
  }
}

module.exports = ({ root, jscodeshift }) => {
  /**
   * @deprecated
   */
  const findImportSpecifier = imported =>
    root
      .find(jscodeshift.ImportDeclaration, {
        source: {
          value: 'react-query',
        },
      })
      .find(jscodeshift.ImportSpecifier, {
        imported: {
          type: jscodeshift.Identifier.name,
          name: imported,
        },
      })

  /**
   * @deprecated
   */
  const findNamespacedImportSpecifiers = () =>
    root
      .find(jscodeshift.ImportDeclaration, {
        source: {
          value: 'react-query',
        },
      })
      .find(jscodeshift.ImportNamespaceSpecifier)

  const findImportIdentifierOf = (importSpecifiers, identifier) => {
    const specifier = importSpecifiers
      .filter(node => node.value.imported.name === identifier)
      .paths()

    if (specifier.length > 0) {
      return specifier[0].value.local
    }

    return jscodeshift.identifier(identifier)
  }

  const findImportSpecifiers = () =>
    root
      .find(jscodeshift.ImportDeclaration, {
        source: {
          value: 'react-query',
        },
      })
      .find(jscodeshift.ImportSpecifier, {})

  const locateImports = identifiers => {
    const findNamespaceImportIdentifier = () => {
      const specifier = findNamespacedImportSpecifiers().paths()

      return specifier.length > 0 ? specifier[0].value.local : null
    }

    /**
     * First, we search for the namespace import identifier because if we have any, we assume the consumer uses
     * namespace imports. In this case, we won't search for named imports at all.
     */
    const namespaceImportIdentifier = findNamespaceImportIdentifier()

    if (namespaceImportIdentifier) {
      const identifierMap = {}

      for (const identifier of identifiers) {
        identifierMap[identifier] = jscodeshift.identifier(identifier)
      }

      return {
        namespace: namespaceImportIdentifier,
        ...identifierMap,
      }
    }

    const importSpecifiers = findImportSpecifiers()
    const identifierMap = {}

    for (const identifier of identifiers) {
      identifierMap[identifier] = findImportIdentifierOf(
        importSpecifiers,
        identifier
      )
    }

    return {
      namespace: null,
      ...identifierMap,
    }
  }

  const isCallExpression = node =>
    jscodeshift.match(node, { type: jscodeshift.CallExpression.name })

  const isIdentifier = node =>
    jscodeshift.match(node, { type: jscodeshift.Identifier.name })

  const isMemberExpression = node =>
    jscodeshift.match(node, { type: jscodeshift.MemberExpression.name })

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

  return {
    findImportSpecifier,
    findNamespacedImportSpecifiers,
    getSelectorByImports,
    isCallExpression,
    isFunctionCallOf,
    isIdentifier,
    isMemberExpression,
    locateImports,
  }
}

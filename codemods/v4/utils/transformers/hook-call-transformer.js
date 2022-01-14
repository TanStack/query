module.exports = ({ jscodeshift, utils, root }) => {
  const findHookCallsByIdentifier = node =>
    root.find(jscodeshift.CallExpression, {
      callee: {
        type: jscodeshift.Identifier.name,
        name: node.name,
      },
    })

  const findHookCallsByMemberExpression = node =>
    root.find(jscodeshift.CallExpression, {
      callee: {
        type: jscodeshift.MemberExpression.name,
        object: {
          type: jscodeshift.Identifier.name,
          name: node.object.name,
        },
        property: {
          type: jscodeshift.Identifier.name,
          name: node.property.name,
        },
      },
    })

  const execute = (hookName, replacer) => {
    utils
      .findNamespacedImportSpecifiers()
      .paths()
      .forEach(specifier => {
        findHookCallsByMemberExpression(
          jscodeshift.memberExpression(
            specifier.value.local,
            jscodeshift.identifier(hookName)
          )
        ).replaceWith(replacer)
      })

    utils
      .findImportSpecifier(hookName)
      .paths()
      .forEach(specifier => {
        findHookCallsByIdentifier(specifier.value.local).replaceWith(replacer)
      })
  }

  return {
    execute,
  }
}

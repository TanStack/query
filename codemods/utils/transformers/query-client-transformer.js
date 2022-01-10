module.exports = ({ jscodeshift, utils, root }) => {
  const findQueryClientInstantiationsByIdentifier = node =>
    root.find(jscodeshift.VariableDeclarator, {
      init: {
        type: jscodeshift.CallExpression.name,
        callee: {
          type: jscodeshift.Identifier.name,
          name: node.name,
        },
      },
    })

  const findQueryClientInstantiationsByMemberExpression = node =>
    root.find(jscodeshift.VariableDeclarator, {
      init: {
        type: jscodeshift.CallExpression.name,
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
      },
    })

  const findQueryClientNamespacedDirectMethodCalls = (node, method) =>
    root.find(jscodeshift.CallExpression, {
      callee: {
        object: {
          type: jscodeshift.CallExpression.name,
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
        },
        property: {
          type: jscodeshift.Identifier.name,
          name: method.name,
        },
      },
    })

  const findQueryClientDirectMethodCalls = (node, method) =>
    root.find(jscodeshift.CallExpression, {
      callee: {
        type: jscodeshift.MemberExpression.name,
        object: {
          type: jscodeshift.CallExpression.name,
          callee: {
            type: jscodeshift.Identifier.name,
            name: node.name,
          },
        },
        property: {
          type: jscodeshift.Identifier.name,
          name: method.name,
        },
      },
    })

  const findQueryClientMethodCalls = (node, method) =>
    root.find(jscodeshift.CallExpression, {
      callee: {
        type: jscodeshift.MemberExpression.name,
        object: {
          type: jscodeshift.Identifier.name,
          name: node.name,
        },
        property: {
          type: jscodeshift.Identifier.name,
          name: method.name,
        },
      },
    })

  const execute = (methodName, replacer) => {
    const hookIdentifier = jscodeshift.identifier('useQueryClient')
    const methodIdentifier = jscodeshift.identifier(methodName)

    utils
      .findNamespacedImportSpecifiers()
      .paths()
      .forEach(specifier => {
        const memberExpression = jscodeshift.memberExpression(
          specifier.value.local,
          hookIdentifier
        )

        // Here we replace usages like:
        // RQ.useQueryClient().methodToBeCalled(...)
        findQueryClientNamespacedDirectMethodCalls(
          memberExpression,
          methodIdentifier
        ).replaceWith(replacer)

        // Here we replace usages like:
        // const queryClient = RQ.useQueryClient()
        // queryClient.methodToBeCalled(...)
        findQueryClientInstantiationsByMemberExpression(memberExpression)
          .paths()
          .forEach(declaration => {
            findQueryClientMethodCalls(
              declaration.value.id,
              methodIdentifier
            ).replaceWith(replacer)
          })
      })

    utils
      .findImportSpecifier(hookIdentifier.name)
      .paths()
      .forEach(specifier => {
        // Here we replace usages like:
        // useQueryClient().methodToBeCalled(...)
        findQueryClientDirectMethodCalls(
          specifier.value.local,
          methodIdentifier
        ).replaceWith(replacer)

        // Here we replace usages like:
        // const queryClient = useQueryClient()
        // queryClient.methodToBeCalled(...)
        findQueryClientInstantiationsByIdentifier(specifier.value.local)
          .paths()
          .forEach(declaration => {
            findQueryClientMethodCalls(
              declaration.value.id,
              methodIdentifier
            ).replaceWith(replacer)
          })
      })
  }

  return {
    execute,
  }
}

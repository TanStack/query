// eslint-disable-next-line @typescript-eslint/no-var-requires
const UnprocessableQueryKeyError = require('../unprocessable-query-key-error')

module.exports = ({ jscodeshift, root }) => {
  const isArrayExpression = node =>
    jscodeshift.match(node, { type: jscodeshift.ArrayExpression.name })

  const isStringLiteral = node =>
    jscodeshift.match(node, { type: jscodeshift.StringLiteral.name })

  const findVariableDeclaration = node => {
    const declarations = root
      .find(jscodeshift.VariableDeclarator, {
        id: {
          type: jscodeshift.Identifier.name,
          name: node.name,
        },
      })
      .paths()

    return declarations.length > 0 ? declarations[0] : null
  }

  const createQueryKeyValue = node => {
    // When the node is an array expression we just simply return it because we want query keys to be arrays.
    if (isArrayExpression(node)) {
      return node
    }

    // When the node is a string literal we convert it into an array of strings.
    if (isStringLiteral(node)) {
      return jscodeshift.arrayExpression([
        jscodeshift.stringLiteral(node.value),
      ])
    }

    if (jscodeshift.match(node, { type: jscodeshift.Identifier.name })) {
      // When the node is an identifier at first, we try to find its declaration, because we will try
      // to guess its type.
      const variableDeclaration = findVariableDeclaration(node)

      if (!variableDeclaration) {
        throw new UnprocessableQueryKeyError(
          `At line ${node.loc.start.line} the type of identifier \`${node.name}\` couldn't be recognized, so the codemod couldn't be applied. Please do the migration manually.`
        )
      }

      const initializer = variableDeclaration.value.init

      // Same as above, when it's an array expression, we're good to go.
      if (isArrayExpression(initializer)) {
        return node
      }

      // When it's a string, we just wrap it into an array expression.
      if (isStringLiteral(initializer)) {
        return jscodeshift.arrayExpression([node])
      }
    }

    throw new UnprocessableQueryKeyError(
      `At line ${node.loc.start.line} the type of the \`queryKey\` couldn't be recognized, so the codemod couldn't be applied. Please do the migration manually.`
    )
  }

  const createQueryKeyProperty = node =>
    jscodeshift.property(
      'init',
      jscodeshift.identifier('queryKey'),
      createQueryKeyValue(node)
    )

  const getPropertyFromObjectExpression = (objectExpression, propertyName) =>
    objectExpression.properties.find(
      property => property.key.name === propertyName
    ) ?? null

  return ({ node }) => {
    // When the node doesn't have the 'original' property, that means the codemod has been already applied,
    // so we don't need to do any changes.
    if (!node.original) {
      return node
    }

    const methodArguments = node.arguments

    // The method call doesn't have any arguments, we have nothing to do in this case.
    if (methodArguments.length === 0) {
      return node
    }

    try {
      const [firstArgument, ...restOfTheArguments] = methodArguments

      if (
        jscodeshift.match(firstArgument, {
          type: jscodeshift.ObjectExpression.name,
        })
      ) {
        const originalQueryKey = getPropertyFromObjectExpression(
          firstArgument,
          'queryKey'
        )

        if (!originalQueryKey) {
          throw new UnprocessableQueryKeyError(
            `At line ${node.loc.start.line} the query key couldn't be found. Did you forget to add it?`
          )
        }

        const restOfTheProperties = firstArgument.properties.filter(
          item => item.key.name !== 'queryKey'
        )

        return jscodeshift.callExpression(node.original.callee, [
          jscodeshift.objectExpression([
            createQueryKeyProperty(originalQueryKey.value),
            ...restOfTheProperties,
          ]),
          ...restOfTheArguments,
        ])
      }

      return jscodeshift.callExpression(node.original.callee, [
        createQueryKeyValue(firstArgument),
        ...restOfTheArguments,
      ])
    } catch (error) {
      if (error.name === 'UnprocessableQueryKeyError') {
        console.warn(error.message)
        return node
      }

      throw error
    }
  }
}

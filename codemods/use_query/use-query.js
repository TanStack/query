module.exports = (file, api) => {
    const j = api.jscodeshift // eslint-disable-line id-length
    const root = j(file.source)

    const importSpecifier = root
        .find(j.ImportDeclaration, {
            source: {
                type: 'StringLiteral',
                value: 'react-query',
            },
        })
        .find(j.ImportSpecifier, {
            imported: {
                type: 'Identifier',
                name: 'useQuery',
            },
        })

    importSpecifier.paths().forEach((specifier) => {
        const localImportName = specifier.value.local.name

        root.find(j.CallExpression, {
            callee: {
                type: 'Identifier',
                name: localImportName,
            },
        }).replaceWith(({ node }) => {
            const [queryKeyArgument, queryFnArgument] = node.arguments

            return j.callExpression(j.identifier(localImportName), [
                j.objectExpression([
                    j.property('init', j.identifier('queryKey'), queryKeyArgument),
                    j.property('init', j.identifier('queryFn'), queryFnArgument),
                ]),
            ])
        })
    })

    return root.toSource({ quote: 'single' })
}

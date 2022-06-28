module.exports = (file, api) => {
  const jscodeshift = api.jscodeshift
  const root = jscodeshift(file.source)

  const findImportSpecifiers = () =>
    root.find(jscodeshift.ImportDeclaration, {
      source: {
        value: 'react-query',
      },
    })

  findImportSpecifiers().replaceWith(({ node }) => {
    node.source.value = '@tanstack/react-query'

    return node
  })

  return root.toSource({ quote: 'single' })
}

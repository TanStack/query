module.exports = ({ jscodeshift, utils, root }) => {
  const execute = (hooks, replacer) => {
    const imports = utils.locateImports(hooks)

    const isHookCall = node => {
      for (const hook of hooks) {
        const selector = utils.getSelectorByImports(imports, hook)

        if (utils.isFunctionCallOf(node.value, selector)) {
          return true
        }
      }

      return false
    }

    root
      .find(jscodeshift.CallExpression, {})
      .filter(isHookCall)
      .replaceWith(replacer)
  }

  return {
    execute,
  }
}

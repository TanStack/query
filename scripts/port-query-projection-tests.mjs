// Adapt v6 option values only in the experimental copy. A tuple literal keeps
// inline selectors contextually typed by the real options factory.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'

export function portProjectionOptions(directory) {
  for (const file of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, file.name)
    if (file.isDirectory()) {
      portProjectionOptions(path)
      continue
    }
    if (!/\.tsx?$/.test(file.name)) continue
    const text = readFileSync(path, 'utf8')
    const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true)
    const edits = []
    const imports = new Set()

    function option(node) {
      if (
        !ts.isObjectLiteralExpression(node.parent) ||
        !node.name ||
        !ts.isIdentifier(node.name)
      )
        return
      const name = node.name.text
      const isSelect = name === 'select'
      // The mutation-state suite also passes selectors through local variables.
      if (isSelect && file.name.startsWith('useMutationState.test')) return
      if (
        name === 'scope' &&
        ts.isPropertyAssignment(node) &&
        ts.isObjectLiteralExpression(node.initializer)
      ) {
        const [id] = node.initializer.properties
        if (
          node.initializer.properties.length === 1 &&
          ts.isPropertyAssignment(id) &&
          id.name.getText(source) === 'id'
        ) {
          imports.add(
            "import { serialScope as __serialScope } from '@tanstack/query-core-pluggable'",
          )
          edits.push(
            [
              node.initializer.getStart(source),
              id.initializer.getStart(source),
              '__serialScope(',
            ],
            [id.initializer.end, node.initializer.end, ')'],
          )
        }
        return
      }
      const polling = name === 'refetchInterval'
      if (!isSelect && !polling && name !== 'placeholderData') return
      const helper = polling
        ? '__refetchInterval'
        : isSelect
          ? '__querySelect'
          : '__queryPlaceholder'
      const input = ts.isShorthandPropertyAssignment(node)
        ? node.name
        : node.initializer
      if (polling) {
        imports.add(
          "import { refetchInterval as __refetchInterval } from '@tanstack/query-core-pluggable'",
        )
        // Let the query options infer the callback's query and data types.
        if (
          input &&
          ts.isArrowFunction(input) &&
          input.parameters.some((p) => !p.type)
        ) {
          function wrapDelay(value) {
            edits.push(
              [value.getStart(source), value.getStart(source), helper + '('],
              [value.end, value.end, ')'],
            )
          }
          function visitReturn(child) {
            if (ts.isFunctionLike(child)) return
            if (ts.isReturnStatement(child) && child.expression)
              wrapDelay(child.expression)
            else ts.forEachChild(child, visitReturn)
          }
          if (ts.isBlock(input.body)) visitReturn(input.body)
          else wrapDelay(input.body)
          return
        }
      } else if (
        ts.isMethodDeclaration(node) ||
        (input &&
          (ts.isArrowFunction(input) || ts.isFunctionExpression(input)) &&
          input.parameters.some((p) => !p.type))
      ) {
        imports.add(
          'import { ' +
            name +
            ' as ' +
            helper +
            " } from '@tanstack/query-core-pluggable'",
        )
        if (ts.isMethodDeclaration(node)) {
          edits.push(
            [node.name.end, node.name.end, ': [' + helper + ', function'],
            [node.end, node.end, ']'],
          )
        } else {
          edits.push(
            [
              input.getStart(source),
              input.getStart(source),
              '[' + helper + ', ',
            ],
            [input.end, input.end, ']'],
          )
        }
        return
      }
      if (!input || input.getText(source) === 'undefined') return
      const wrapper = polling
        ? helper
        : isSelect
          ? 'portSelect'
          : 'portPlaceholder'
      if (!polling)
        imports.add('import { ' + wrapper + " } from '#compat/projection'")
      if (ts.isShorthandPropertyAssignment(node)) {
        edits.push([node.end, node.end, ': ' + wrapper + '(' + name + ')'])
      } else {
        edits.push(
          [input.getStart(source), input.getStart(source), wrapper + '('],
          [input.end, input.end, ')'],
        )
      }
    }
    function visit(node) {
      if (
        ts.isPropertyAssignment(node) ||
        ts.isShorthandPropertyAssignment(node) ||
        ts.isMethodDeclaration(node)
      )
        option(node)
      ts.forEachChild(node, visit)
    }
    visit(source)
    if (!edits.length) continue
    let result = text
    for (const [start, end, replacement] of edits.sort((a, b) => b[0] - a[0])) {
      result = result.slice(0, start) + replacement + result.slice(end)
    }
    writeFileSync(path, [...imports].join('\n') + '\n' + result)
  }
}

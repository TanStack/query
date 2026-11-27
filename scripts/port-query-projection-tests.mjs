// Port explicitly marked query options in the copy used by the pluggable adapter.
// A tuple literal keeps inline callbacks contextually typed by the actual query hook.
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
    if (!text.includes('@tanstack/query-test-utils/projection')) continue

    const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true)
    const edits = []
    const imports = new Set()
    function visit(node) {
      if (
        (ts.isMethodDeclaration(node) || ts.isPropertyAssignment(node)) &&
        ts.isObjectLiteralExpression(node.parent) &&
        ts.isComputedPropertyName(node.name) &&
        ts.isIdentifier(node.name.expression)
      ) {
        const marker = node.name.expression.text
        if (marker === 'selectOption' || marker === 'placeholderOption') {
          const isSelect = marker === 'selectOption'
          const feature = isSelect ? 'select' : 'placeholderData'
          const name = isSelect ? '__querySelect' : '__queryPlaceholder'
          const wrapper = isSelect ? 'portSelect' : 'portPlaceholder'
          if (ts.isMethodDeclaration(node)) {
            imports.add(feature + ' as ' + name)
            edits.push([
              node.name.end,
              node.name.end,
              ': [' + name + ', function',
            ])
            edits.push([node.end, node.end, ']'])
          } else {
            const input = node.initializer
            if (
              (ts.isArrowFunction(input) || ts.isFunctionExpression(input)) &&
              input.parameters.some((parameter) => !parameter.type)
            ) {
              imports.add(feature + ' as ' + name)
              edits.push([
                input.getStart(source),
                input.getStart(source),
                '[' + name + ', ',
              ])
              edits.push([input.end, input.end, ']'])
            } else if (input.getText(source) !== 'undefined') {
              imports.add(wrapper)
              edits.push([
                input.getStart(source),
                input.getStart(source),
                wrapper + '(',
              ])
              edits.push([input.end, input.end, ')'])
            }
          }
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(source)
    if (!edits.length) continue
    let result = text
    for (const [start, end, replacement] of edits.sort((a, b) => b[0] - a[0])) {
      result = result.slice(0, start) + replacement + result.slice(end)
    }
    writeFileSync(
      path,
      'import { ' +
        [...imports].join(', ') +
        " } from '@tanstack/query-test-utils/projection'\n" +
        result,
    )
  }
}

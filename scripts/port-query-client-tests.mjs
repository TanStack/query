// Port only calls on the original QueryClient. The upstream checker distinguishes
// its methods from identically named methods on observers, caches and promises.
import path from 'node:path'
import ts from 'typescript'

const renamed = {
  query: 'fetchQuery',
  infiniteQuery: 'fetchInfiniteQuery',
  mount: 'mountQueryClient',
  unmount: 'unmountQueryClient',
  clear: 'clearQueryClient',
}

export function queryClientTestPort(upstream, files, packageName) {
  const config = ts.readConfigFile(
    path.join(upstream, 'tsconfig.json'),
    ts.sys.readFile,
  )
  const { options } = ts.parseJsonConfigFileContent(
    config.config,
    ts.sys,
    upstream,
  )
  const program = ts.createProgram(files, options)
  const checker = program.getTypeChecker()

  function isClientMethod(receiver, name) {
    return checker
      .getTypeAtLocation(receiver)
      .getProperty(name)
      ?.declarations?.some(
        (declaration) =>
          declaration.parent.name?.text === 'QueryClient' &&
          /\/query-core\/(?:src|build|dist-ts)\//.test(
            declaration.getSourceFile().fileName,
          ),
      )
  }

  return function port(file) {
    const source = program.getSourceFile(file)
    const edits = []
    const api = '__clientOperations'
    let usesOperations = false
    let checksArguments = false
    function edit(start, end, text) {
      edits.push({ start, end, text })
    }
    function operation(name) {
      usesOperations = true
      return api + '.' + (renamed[name] ?? name)
    }
    function typeReference(node) {
      if (
        ts.isIndexedAccessTypeNode(node) &&
        ts.isLiteralTypeNode(node.indexType) &&
        ts.isStringLiteral(node.indexType.literal) &&
        isClientMethod(node.objectType, node.indexType.literal.text)
      ) {
        return {
          operation: 'typeof ' + operation(node.indexType.literal.text),
          client: api + '.QueryClient',
        }
      }
      if (
        ts.isTypeQueryNode(node) &&
        ts.isQualifiedName(node.exprName) &&
        isClientMethod(node.exprName.left, node.exprName.right.text)
      ) {
        const generic = node.typeArguments?.length
          ? '<' +
            node.typeArguments.map((t) => t.getText(source)).join(', ') +
            '>'
          : ''
        return {
          operation: 'typeof ' + operation(node.exprName.right.text) + generic,
          client: 'typeof ' + node.exprName.left.getText(source),
        }
      }
    }
    function visit(node) {
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier) &&
        node.moduleSpecifier.text === '@tanstack/query-core'
      ) {
        edit(
          node.moduleSpecifier.getStart(),
          node.moduleSpecifier.end,
          JSON.stringify(packageName),
        )
        return
      }
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression)
      ) {
        const member = node.expression
        if (isClientMethod(member.expression, member.name.text)) {
          edit(member.getStart(), member.end, operation(member.name.text))
          edit(
            node.arguments.pos,
            node.arguments.pos,
            member.expression.getText(source) +
              (node.arguments.length ? ', ' : ''),
          )
          for (const arg of [...(node.typeArguments ?? []), ...node.arguments])
            visit(arg)
          return
        }
      }
      // Tests that inspect the old parameter tuple still check every original
      // argument. The new first argument must be compatible with the receiver.
      if (
        ts.isTypeReferenceNode(node) &&
        node.typeName.getText(source) === 'Parameters' &&
        node.typeArguments?.length === 1
      ) {
        const ref = typeReference(node.typeArguments[0])
        if (ref) {
          checksArguments = true
          edit(
            node.getStart(),
            node.end,
            '__OperationArgs<' + ref.operation + ', ' + ref.client + '>',
          )
          return
        }
      }
      if (
        ts.isPropertyAccessExpression(node) &&
        node.name.text === 'parameters' &&
        ts.isCallExpression(node.expression)
      ) {
        const assertion = node.expression,
          member = assertion.arguments[0]
        if (
          assertion.expression.getText(source) === 'expectTypeOf' &&
          member &&
          ts.isPropertyAccessExpression(member) &&
          isClientMethod(member.expression, member.name.text)
        ) {
          checksArguments = true
          edit(
            node.getStart(),
            node.end,
            'expectTypeOf<__OperationArgs<typeof ' +
              operation(member.name.text) +
              ', typeof ' +
              member.expression.getText(source) +
              '>>()',
          )
          return
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(source)
    let result = source.text
    for (const { start, end, text } of edits.sort(
      (a, b) => b.start - a.start || b.end - a.end,
    )) {
      result = result.slice(0, start) + text + result.slice(end)
    }
    if (!usesOperations) return result
    const argumentsType = checksArguments
      ? 'type __OperationArgs<F extends (...args: never[]) => unknown, Client> = Parameters<F> extends [Client, ...infer Args] ? Args : never\n'
      : ''
    return (
      'import * as ' +
      api +
      ' from ' +
      JSON.stringify(packageName) +
      '\n' +
      argumentsType +
      result
    )
  }
}

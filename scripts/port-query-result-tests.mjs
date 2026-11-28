import ts from 'typescript'

const flags = new Set([
  'isPending',
  'isSuccess',
  'isError',
  'isFetching',
  'isPaused',
  'isLoading',
  'isRefetching',
  'isLoadingError',
  'isRefetchError',
  'isFetched',
  'isFetchingNextPage',
  'isFetchingPreviousPage',
  'isFetchNextPageError',
  'isFetchPreviousPageError',
])

// The stock checker distinguishes query flags from mutation flags and application
// fields with the same names. Keep each original expectation and use the public
// predicate, including the narrowed result type for old literal-flag assertions.
export function queryResultTestPort(checker, source, edit, packageName) {
  const api = '__queryFlags'
  const imports = new Set()
  let usesFlags = false
  function fromQueryResult(type, name = 'isPending') {
    const definite = checker.getNonNullableType(type)
    return definite
      .getProperty(name)
      ?.declarations?.some(
        (d) =>
          /^(?:Infinite)?QueryObserver\w*Result$/.test(
            d.parent.name?.text ?? '',
          ) &&
          /\/query-core\/(?:src|build|dist-ts)\//.test(
            d.getSourceFile().fileName,
          ),
      )
  }
  function isResultOrArray(type) {
    if (fromQueryResult(type)) return true
    const element = checker.getIndexTypeOfType(
      checker.getNonNullableType(type),
      ts.IndexKind.Number,
    )
    return element && element !== type && isResultOrArray(element)
  }
  function containsFlag(node) {
    if (ts.isPropertyAssignment(node) && flags.has(node.name.text)) return true
    return ts.forEachChild(node, containsFlag)
  }
  function predicateType(flag, input) {
    usesFlags = true
    return 'typeof ' + api + '.' + flag + '<' + input + '>'
  }
  function valueType(input, flag) {
    imports.add('type FlagFor')
    return 'FlagFor<' + input + ', ' + predicateType(flag, input) + '>'
  }
  function extraction(node) {
    if (
      !ts.isTypeReferenceNode(node) ||
      !node.typeArguments?.some(ts.isTypeLiteralNode)
    )
      return
    if (
      node.typeName.getText(source) === 'Extract' &&
      node.typeArguments.length === 2
    )
      return node.typeArguments
    // Both observer suites also define Branch<Filter> = Extract<Result, Filter>.
    // Resolve the alias so its writable-branch assertions keep selecting real variants.
    const alias = checker.getSymbolAtLocation(node.typeName)?.declarations?.[0]
    if (
      !alias ||
      alias.getSourceFile() !== source ||
      !ts.isTypeAliasDeclaration(alias) ||
      alias.typeParameters?.length !== 1 ||
      node.typeArguments.length !== 1 ||
      !ts.isTypeReferenceNode(alias.type) ||
      alias.type.typeName.getText(source) !== 'Extract' ||
      alias.type.typeArguments?.length !== 2 ||
      alias.type.typeArguments[1].getText(source) !==
        alias.typeParameters[0].name.text
    )
      return
    return [alias.type.typeArguments[0], node.typeArguments[0]]
  }
  function visit(node) {
    const extracted = extraction(node)
    if (extracted) {
      const [input, selector] = extracted
      if (
        ts.isTypeLiteralNode(selector) &&
        fromQueryResult(checker.getTypeAtLocation(input))
      ) {
        for (const prop of selector.members) {
          const name = prop.name?.getText(source)
          if (!flags.has(name)) continue
          if (
            name === 'isLoading' &&
            prop.type?.kind === ts.SyntaxKind.BooleanKeyword
          ) {
            edit(prop.getStart(source), prop.end, '')
          } else if (prop.type?.getText(source) === 'true') {
            const type =
              node.typeName.getText(source) === 'Extract'
                ? 'Guarded'
                : 'GuardedProperties'
            imports.add('type ' + type)
            edit(
              node.getStart(source),
              node.end,
              type + '<' + predicateType(name, input.getText(source)) + '>',
            )
          }
        }
      }
    }
    if (
      ts.isIndexedAccessTypeNode(node) &&
      ts.isLiteralTypeNode(node.indexType) &&
      flags.has(node.indexType.literal.text) &&
      fromQueryResult(
        checker.getTypeAtLocation(node.objectType),
        node.indexType.literal.text,
      )
    ) {
      const flag = node.indexType.literal.text,
        input = node.objectType.getText(source)
      edit(node.getStart(source), node.end, valueType(input, flag))
    }
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ['toMatchObject', 'toStrictEqual', 'toEqual'].includes(
        node.expression.name.text,
      )
    ) {
      const expect = node.expression.expression
      if (
        ts.isCallExpression(expect) &&
        expect.expression.getText(source) === 'expect' &&
        expect.arguments.length === 1 &&
        node.arguments[0] &&
        containsFlag(node.arguments[0]) &&
        isResultOrArray(checker.getTypeAtLocation(expect.arguments[0]))
      ) {
        imports.add('resultForComparison')
        const actual = expect.arguments[0]
        edit(
          actual.getStart(source),
          actual.getStart(source),
          'resultForComparison(',
        )
        edit(actual.end, actual.end, ')')
      }
    }
    if (
      !ts.isPropertyAccessExpression(node) ||
      !flags.has(node.name.text) ||
      !fromQueryResult(
        checker.getTypeAtLocation(node.expression),
        node.name.text,
      )
    )
      return
    const name = node.name.text,
      receiver = node.expression
    const expect = node.parent
    if (
      ts.isCallExpression(expect) &&
      expect.expression.getText(source) === 'expectTypeOf' &&
      ts.isPropertyAccessExpression(expect.parent) &&
      ts.isCallExpression(expect.parent.parent) &&
      /^(?:true|false|boolean)$/.test(
        expect.parent.parent.typeArguments?.[0]?.getText(source),
      ) &&
      ts.isIdentifier(receiver)
    ) {
      edit(
        expect.getStart(source),
        expect.end,
        'expectTypeOf<' + valueType('typeof ' + receiver.text, name) + '>()',
      )
      return
    }
    usesFlags = true
    const optional =
      node.questionDotToken &&
      checker.getTypeAtLocation(receiver) !==
        checker.getNonNullableType(checker.getTypeAtLocation(receiver))
    const prefix = optional
      ? '(' + receiver.getText(source) + ' == null ? undefined : '
      : ''
    edit(
      receiver.getStart(source),
      receiver.getStart(source),
      prefix + api + '.' + name + '(',
    )
    edit(receiver.end, node.end, optional ? '))' : ')')
  }
  return {
    visit,
    imports: () =>
      (usesFlags
        ? 'import * as ' + api + ' from ' + JSON.stringify(packageName) + '\n'
        : '') +
      (imports.size
        ? 'import { ' + [...imports].join(', ') + ' } from "#compat/result"\n'
        : ''),
  }
}

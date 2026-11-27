// Identify removed instance methods by their upstream declarations. This keeps
// identically named methods on unrelated objects intact in the copied tests.
import path from 'node:path'
import ts from 'typescript'
import { queryResultTestPort } from './port-query-result-tests.mjs'

const renamed = {
  mount: 'mountQueryClient',
  unmount: 'unmountQueryClient',
  clear: 'clearQueryClient',
  isFetching: 'countFetchingQueries',
}

const cacheOperations = {
  find: 'findCachedQuery',
  findAll: 'findCachedQueries',
  clear: 'clearQueryCache',
}
const queryOperations = {
  isActive: 'isQueryActive',
  isDisabled: 'isQueryDisabled',
  isStatic: 'isQueryStatic',
  isStale: 'isQueryStale',
}
const queryFactories = {
  useInfiniteQuery: 'infiniteQueryOptions',
  useSuspenseQuery: 'suspenseQueryOptions',
  useSuspenseInfiniteQuery: 'suspenseInfiniteQueryOptions',
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

  function methodName(receiver, name) {
    const declarations =
      checker.getTypeAtLocation(receiver).getProperty(name)?.declarations ?? []
    for (const declaration of declarations) {
      if (
        !/\/query-core\/(?:src|build|dist-ts)\//.test(
          declaration.getSourceFile().fileName,
        )
      )
        continue
      switch (declaration.parent.name?.text) {
        case 'QueryClient':
          return renamed[name] ?? name
        case 'QueryCache':
          return cacheOperations[name]
        case 'Query':
          return queryOperations[name]
        case 'QueryObserver':
          return name === 'fetchOptimistic' ? name : undefined
      }
    }
  }

  return function port(file) {
    const source = program.getSourceFile(file)
    const edits = []
    const resultPort = queryResultTestPort(checker, source, edit, packageName)
    const api = '__clientOperations'
    let usesOperations = false
    const factories = new Map()
    let usesBoundaryOption = false
    let checksArguments = false
    let checksOptimisticOptions = false
    function edit(start, end, text) {
      edits.push({ start, end, text })
    }
    function operation(name) {
      usesOperations = true
      return api + '.' + name
    }
    function typeReference(node) {
      if (
        ts.isIndexedAccessTypeNode(node) &&
        ts.isLiteralTypeNode(node.indexType) &&
        ts.isStringLiteral(node.indexType.literal) &&
        methodName(node.objectType, node.indexType.literal.text)
      ) {
        return {
          operation:
            'typeof ' +
            operation(methodName(node.objectType, node.indexType.literal.text)),
          client: api + '.QueryClient',
        }
      }
      if (
        ts.isTypeQueryNode(node) &&
        ts.isQualifiedName(node.exprName) &&
        methodName(node.exprName.left, node.exprName.right.text)
      ) {
        const generic = node.typeArguments?.length
          ? '<' +
            node.typeArguments.map((t) => t.getText(source)).join(', ') +
            '>'
          : ''
        return {
          operation:
            'typeof ' +
            operation(
              methodName(node.exprName.left, node.exprName.right.text),
            ) +
            generic,
          client: 'typeof ' + node.exprName.left.getText(source),
        }
      }
    }
    function visit(node) {
      resultPort.visit(node)
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
        ts.isImportDeclaration(node) &&
        source.fileName.includes('/react-query/src/__tests__/') &&
        node.importClause?.namedBindings &&
        ts.isNamedImports(node.importClause.namedBindings)
      ) {
        const bindings = node.importClause.namedBindings
        const keep = bindings.elements.filter((entry) => {
          const name = (entry.propertyName ?? entry.name).text
          if (!Object.hasOwn(queryFactories, name)) return true
          const symbol = checker.getSymbolAtLocation(entry.name)
          const target = symbol && checker.getAliasedSymbol(symbol)
          if (
            !target?.declarations?.some((d) =>
              d
                .getSourceFile()
                .fileName.endsWith('/react-query/src/' + name + '.ts'),
            )
          )
            return true
          factories.set(symbol, queryFactories[name])
          return false
        })
        if (keep.length !== bindings.elements.length) {
          if (keep.length)
            edit(
              bindings.getStart(),
              bindings.end,
              '{' + keep.map((e) => e.getText(source)).join(', ') + '}',
            )
          else edit(node.getStart(), node.end, '')
          return
        }
      }
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        const factory =
          factories.size &&
          factories.get(checker.getSymbolAtLocation(node.expression))
        // Single-query readers opt into the React boundary policy explicitly.
        const options = node.arguments[0]
        if (
          (node.expression.text === 'useQuery' ||
            factory === 'infiniteQueryOptions') &&
          options &&
          ts.isObjectLiteralExpression(options)
        ) {
          for (const prop of options.properties) {
            if (
              ts.isPropertyAssignment(prop) &&
              prop.name.getText(source) === 'throwOnError'
            ) {
              usesBoundaryOption = true
              edit(
                prop.initializer.getStart(),
                prop.initializer.getStart(),
                '[__prepared.throwOnError, ',
              )
              edit(prop.initializer.end, prop.initializer.end, ']')
            }
          }
        }
        if (factory) {
          edit(
            node.expression.getStart(),
            node.expression.end,
            '__prepared.useQuery(__prepared.' + factory,
          )
          edit(node.arguments[0].end, node.arguments[0].end, ')')
        } else if (
          node.expression.text === 'getSuspensePromise' &&
          path.basename(file) === 'suspense.test.tsx'
        ) {
          edit(node.arguments.pos, node.arguments.pos, 'queryClient, ')
        }
      }
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression)
      ) {
        const member = node.expression
        const name = methodName(member.expression, member.name.text)
        if (name) {
          visit(member.expression)
          const generics = node.typeArguments?.length
            ? '<' +
              node.typeArguments.map((t) => t.getText(source)).join(', ') +
              '>'
            : ''
          edit(
            member.getStart(),
            member.getStart(),
            operation(name) +
              generics +
              '(' +
              (name === 'fetchOptimistic' ? 'queryClient, ' : ''),
          )
          edit(
            member.expression.end,
            node.arguments.pos,
            node.arguments.length ? ', ' : '',
          )
          for (const arg of node.arguments) visit(arg)
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
        const target = node.typeArguments[0]
        if (
          ts.isTypeQueryNode(target) &&
          ts.isQualifiedName(target.exprName) &&
          methodName(target.exprName.left, target.exprName.right.text) ===
            'fetchOptimistic'
        ) {
          usesOperations = true
          checksOptimisticOptions = true
          edit(
            node.getStart(),
            node.end,
            '__OptimisticArgs<typeof ' +
              target.exprName.left.getText(source) +
              '>',
          )
          return
        }
        const ref = typeReference(target)
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
          methodName(member.expression, member.name.text)
        ) {
          checksArguments = true
          edit(
            node.getStart(),
            node.end,
            'expectTypeOf<__OperationArgs<typeof ' +
              operation(methodName(member.expression, member.name.text)) +
              ', typeof ' +
              member.expression.getText(source) +
              '>>()',
          )
          return
        }
      }
      if (
        ts.isCallExpression(node) &&
        node.expression.getText(source) === 'expectTypeOf' &&
        node.arguments.length === 1
      ) {
        const member = node.arguments[0]
        if (ts.isPropertyAccessExpression(member)) {
          const name = methodName(member.expression, member.name.text)
          if (name) {
            if (name === 'fetchOptimistic') {
              edit(
                member.getStart(),
                member.end,
                '() => ' +
                  operation(name) +
                  '(queryClient, ' +
                  member.expression.getText(source) +
                  ', ' +
                  member.expression.getText(source) +
                  '.options)',
              )
            } else if (Object.hasOwn(queryOperations, member.name.text)) {
              edit(
                member.getStart(),
                member.end,
                '() => ' +
                  operation(name) +
                  '(' +
                  member.expression.getText(source) +
                  ')',
              )
            } else {
              edit(member.getStart(), member.end, operation(name))
            }
          }
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
    result = resultPort.imports() + result
    if (factories.size || usesBoundaryOption)
      result =
        "import * as __prepared from '@tanstack/react-query-pluggable'\n" +
        result
    if (path.basename(file) === 'queryCache.test-d.tsx') {
      result = result
        .replace(/^ *\| '(?:clear|find|findAll)'\n/gm, '')
        .replace(
          /(expectTypeOf\(__clientOperations.findCachedQuery\)\s*\.parameter\()0\)/g,
          (_match, prefix) => prefix + '1)',
        )
    }
    if (path.basename(file) === 'query.test-d.tsx') {
      result = result.replace(
        /^ *\| '(?:isActive|isDisabled|isStatic|isStale)'\n/gm,
        '',
      )
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
      (checksOptimisticOptions
        ? 'type __OptimisticArgs<O> = O extends __clientOperations.QueryObserver<infer F, infer E, infer D, infer Q, infer K> ? [Parameters<typeof __clientOperations.fetchOptimistic<F, E, D, Q, K>>[2]] : never\n'
        : '') +
      result
    )
  }
}

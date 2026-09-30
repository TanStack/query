import ts from 'typescript'
import { MigrationImports } from './imports'

export const OLD_PACKAGE = '@tanstack/angular-query-experimental'

// The experimental helpers used two different injector argument shapes.
const injectorArguments: Record<
  string,
  { index: number; kind: 'injector' | 'options' } | undefined
> = {
  injectQueries: { index: 1, kind: 'injector' },
  injectQuery: { index: 1, kind: 'options' },
  injectInfiniteQuery: { index: 1, kind: 'options' },
  injectMutation: { index: 1, kind: 'options' },
  injectMutationState: { index: 1, kind: 'options' },
  injectIsFetching: { index: 1, kind: 'options' },
  injectIsMutating: { index: 1, kind: 'options' },
  injectIsRestoring: { index: 0, kind: 'options' },
  injectDevtoolsPanel: { index: 1, kind: 'options' },
}
const removedInjectorOptions = new Set([
  'InjectQueryOptions',
  'InjectInfiniteQueryOptions',
  'InjectMutationOptions',
  'InjectMutationStateOptions',
  'InjectIsFetchingOptions',
  'InjectIsMutatingOptions',
  'InjectDevtoolsPanelOptions',
])
const removedApis: Record<string, string | undefined> = {
  provideIsRestoring:
    'Restoration is managed by withPersistQueryClient. Review custom restoration providers.',
  queryFeature:
    'Custom feature construction is no longer public. Use the supported with* features.',
  QueryFeatures: 'Use the non-generic QueryFeature type.',
  DevtoolsFeature: 'Use the non-generic QueryFeature type.',
  PersistQueryClientFeature: 'Use the non-generic QueryFeature type.',
  CreateBaseQueryOptions: 'Use CreateQueryOptions and review typed wrappers.',
}

/** Source edits preserve untouched formatting; symbols protect shadowed local names. */
export function migrateSource(
  text: string,
  path: string,
  packageName: string,
  devtoolsPackageName: string,
  report: (message: string) => void,
) {
  const result = { needsDevtools: false }
  const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true)
  // Binding symbols distinguish imports from identically named local parameters.
  const host = ts.createCompilerHost({ noLib: true })
  host.getSourceFile = (name) => (name === path ? source : undefined)
  const checker = ts
    .createProgram([path], { noLib: true, noResolve: true }, host)
    .getTypeChecker()
  const bindings = new Map<ts.Symbol, string>()
  const namespaces = new Set<ts.Symbol>()
  const edits: Array<{ start: number; end: number; text: string }> = []
  const replace = (node: ts.Node, value: string) => {
    const start = node.getStart(source)
    // A whole-import removal supersedes its earlier module-specifier edit.
    for (let index = edits.length - 1; index >= 0; index--) {
      if (edits[index]!.start >= start && edits[index]!.end <= node.end)
        edits.splice(index, 1)
    }
    edits.push({ start, end: node.end, text: value })
  }
  const warn = (node: ts.Node, message: string) =>
    report(
      `${path}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1}: ${message}`,
    )
  const renames: Record<string, string> = {
    provideAngularQuery: 'provideTanStackQuery',
    provideQueryClient: 'provideTanStackQuery',
  }
  const imports = new MigrationImports(source, checker, (module) =>
    module === OLD_PACKAGE ||
    module === `${OLD_PACKAGE}/inject-queries-experimental`
      ? packageName
      : module,
  )

  function migrateImports() {
    for (const statement of source.statements) {
      if (
        (!ts.isImportDeclaration(statement) &&
          !ts.isExportDeclaration(statement)) ||
        !statement.moduleSpecifier ||
        !ts.isStringLiteral(statement.moduleSpecifier)
      )
        continue
      const module = statement.moduleSpecifier.text
      const targets: Record<string, string | undefined> = {
        [OLD_PACKAGE]: packageName,
        [`${OLD_PACKAGE}/inject-queries-experimental`]: packageName,
        [`${OLD_PACKAGE}/devtools`]: devtoolsPackageName,
        [`${OLD_PACKAGE}/devtools/production`]: `${devtoolsPackageName}/production`,
        [`${OLD_PACKAGE}/devtools-panel`]: `${devtoolsPackageName}/devtools-panel`,
        [`${OLD_PACKAGE}/devtools-panel/production`]: `${devtoolsPackageName}/devtools-panel/production`,
      }
      const target = targets[module]
      const isDevtools =
        target?.startsWith(devtoolsPackageName) ||
        module === devtoolsPackageName ||
        module.startsWith(`${devtoolsPackageName}/`)
      if (isDevtools) result.needsDevtools = true
      if (target) replace(statement.moduleSpecifier, JSON.stringify(target))
      else if (module.startsWith(`${OLD_PACKAGE}/`))
        warn(
          statement,
          'Unrecognized experimental entrypoint. Update this package reference manually.',
        )
      if (
        module !== OLD_PACKAGE &&
        module !== packageName &&
        module !== `${OLD_PACKAGE}/inject-queries-experimental` &&
        !isDevtools
      )
        continue
      if (ts.isExportDeclaration(statement)) {
        warn(
          statement,
          'Review re-exported APIs and migrate their consumers manually.',
        )
        if (
          statement.exportClause &&
          ts.isNamedExports(statement.exportClause)
        ) {
          for (const element of statement.exportClause.elements)
            warnRemovedApi(element, (element.propertyName ?? element.name).text)
        }
        continue
      }
      const named = statement.importClause?.namedBindings
      if (!named) continue
      if (ts.isNamespaceImport(named)) {
        const symbol = checker.getSymbolAtLocation(named.name)
        if (symbol) namespaces.add(symbol)
      } else {
        const specifiers: Array<string> = []
        for (const element of named.elements) {
          const name = (element.propertyName ?? element.name).text
          const symbol = checker.getSymbolAtLocation(element.name)
          if (symbol) bindings.set(symbol, name)
          warnRemovedApi(element, name)
          const removable =
            name === 'injectQueryClient' && canRemoveHelperImport(element)
          if (!removable)
            specifiers.push(
              !isDevtools && renames[name]
                ? `${element.isTypeOnly ? 'type ' : ''}${renames[name]} as ${element.name.text}`
                : element.getText(source),
            )
          if (name === 'injectQueryClient' && !removable)
            warn(
              element,
              'Review non-call references or arguments to removed injectQueryClient; its import requires manual removal.',
            )
        }
        if (
          specifiers.join(', ') !==
          named.elements.map((element) => element.getText(source)).join(', ')
        ) {
          if (specifiers.length === 0 && !statement.importClause.name)
            replace(statement, '')
          else replace(named, `{ ${specifiers.join(', ')} }`)
        }
      }
    }
  }

  function warnRemovedApi(node: ts.Node, name: string) {
    if (removedInjectorOptions.has(name))
      warn(
        node,
        `${name} was removed. Review typed wrappers and move injector handling to runInInjectionContext.`,
      )
    else if (removedApis[name])
      warn(node, `${name} was removed. ${removedApis[name]}`)
  }

  function canRemoveHelperImport(element: ts.ImportSpecifier) {
    const symbol = checker.getSymbolAtLocation(element.name)
    if (!symbol) return false
    function hasUnsupportedReference(node: ts.Node): boolean {
      if (
        ts.isIdentifier(node) &&
        checker.getSymbolAtLocation(node) === symbol &&
        node !== element.name &&
        node !== element.propertyName
      ) {
        return (
          !ts.isCallExpression(node.parent) ||
          node.parent.expression !== node ||
          node.parent.arguments.length !== 0
        )
      }
      return ts.forEachChild(node, hasUnsupportedReference) ?? false
    }
    return !hasUnsupportedReference(source)
  }

  const apiName = (
    expression: ts.Expression | ts.EntityName,
  ): string | undefined => {
    if (ts.isIdentifier(expression)) {
      const symbol = checker.getSymbolAtLocation(expression)
      return symbol && bindings.get(symbol)
    }
    if (ts.isPropertyAccessExpression(expression)) {
      const symbol = checker.getSymbolAtLocation(expression.expression)
      if (symbol && namespaces.has(symbol)) return expression.name.text
    }
    if (ts.isQualifiedName(expression)) {
      const symbol = checker.getSymbolAtLocation(expression.left)
      if (symbol && namespaces.has(symbol)) return expression.right.text
    }
    return undefined
  }
  function migrateCall(node: ts.CallExpression) {
    const name = apiName(node.expression)
    if (name) warnAboutInjectorArgument(node, name)
    switch (name) {
      case 'provideTanStackQuery':
      case 'provideAngularQuery':
      case 'provideQueryClient':
        migrateProvider(node)
        break
      case 'injectQueryClient':
        migrateClientInjection(node)
        break
      case 'injectIsFetching':
      case 'injectIsMutating':
        migrateActivityFilter(node)
        break
    }
    if (
      name &&
      [
        'injectQuery',
        'injectInfiniteQuery',
        'injectMutation',
        'queryOptions',
        'infiniteQueryOptions',
        'mutationOptions',
      ].includes(name)
    )
      warnAboutObserverOptions(node.arguments[0])
    if (name === 'withDevtools') {
      warnAboutOption(
        node.arguments[1],
        'deps',
        'withDevtools no longer accepts deps. Call inject() inside the devtools options callback and remove deps.',
      )
    }
  }

  function warnAboutInjectorArgument(node: ts.CallExpression, name: string) {
    const argument = injectorArguments[name]
    if (!argument) return
    if (node.arguments.some(ts.isSpreadElement)) {
      warn(
        node,
        `Review spread arguments to ${name}; the stable helper no longer accepts an injector argument or injector options.`,
      )
      return
    }
    if (node.arguments.length <= argument.index) return
    const guidance =
      argument.kind === 'injector'
        ? 'Pass the old injector argument to runInInjectionContext'
        : 'Pass the old options.injector to runInInjectionContext (not the options object itself)'
    warn(
      node,
      `${name} no longer accepts ${argument.kind === 'injector' ? 'an injector argument' : 'injector options'}. ${guidance}, call ${name} inside its callback, and remove the old argument. If it is undefined or contains no injector, remove it and ensure the call is in an injection context.`,
    )
  }

  function migrateProvider(node: ts.CallExpression) {
    const first = node.arguments[0]
    if (
      first &&
      ts.isNewExpression(first) &&
      apiName(first.expression) === 'QueryClient'
    ) {
      edits.push({
        start: first.getStart(source),
        end: first.getStart(source),
        text: '() => ',
      })
    } else if (
      first &&
      !ts.isArrowFunction(first) &&
      !ts.isFunctionExpression(first)
    )
      warn(
        first,
        'Client reference may be an instance, token, or factory; provide a client factory manually.',
      )
    if (ts.isSpreadElement(node.parent))
      edits.push({
        start: node.parent.getStart(source),
        end: node.getStart(source),
        text: '',
      })
    warn(
      node,
      'Verify this provider is in an environment injector; review default SSR hydration and PendingTasks behavior.',
    )
  }

  function unwrap(node: ts.Expression): ts.Expression {
    return ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isNonNullExpression(node)
      ? unwrap(node.expression)
      : node
  }

  function property(node: ts.Expression | undefined, name: string) {
    if (!node) return undefined
    node = unwrap(node)
    if (!ts.isObjectLiteralExpression(node)) return undefined
    return node.properties.find(
      (
        entry,
      ): entry is ts.PropertyAssignment | ts.ShorthandPropertyAssignment =>
        (ts.isPropertyAssignment(entry) ||
          ts.isShorthandPropertyAssignment(entry)) &&
        (ts.isIdentifier(entry.name) || ts.isStringLiteral(entry.name)) &&
        entry.name.text === name,
    )
  }

  function propertyValue(node: ts.Expression | undefined, name: string) {
    const entry = property(node, name)
    return (
      entry && (ts.isPropertyAssignment(entry) ? entry.initializer : entry.name)
    )
  }

  function warnAboutOption(
    node: ts.Expression | undefined,
    name: string,
    message: string,
  ) {
    const entry = property(node, name)
    if (entry) warn(entry, message)
  }

  function warnAboutObserverOptions(node: ts.Expression | undefined) {
    if (!node) return
    node = unwrap(node)
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      if (ts.isBlock(node.body)) {
        const returns = (child: ts.Node) => {
          if (ts.isReturnStatement(child))
            warnAboutObserverOptions(child.expression)
          else if (!ts.isFunctionLike(child)) ts.forEachChild(child, returns)
        }
        ts.forEachChild(node.body, returns)
      } else warnAboutObserverOptions(node.body)
    } else if (ts.isConditionalExpression(node)) {
      warnAboutObserverOptions(node.whenTrue)
      warnAboutObserverOptions(node.whenFalse)
    } else
      warnAboutOption(
        node,
        'throwOnError',
        'Observer throwOnError was removed. Read the error signal or configure an ErrorHandler through cache callbacks. Imperative refetch throwOnError remains supported.',
      )
  }

  function warnAboutIndirectReference(node: ts.Expression, name: string) {
    if (ts.isCallExpression(node.parent) && node.parent.expression === node)
      return
    if (name === 'injectQueryClient')
      warn(
        node,
        'injectQueryClient was removed. Replace this indirect reference with a function that calls inject(QueryClient), and review its consumers.',
      )
    else if (name === 'provideTanStackQuery' || renames[name])
      warn(
        node,
        'Review consumers of this provider reference: provideTanStackQuery expects a QueryClient factory and returns one EnvironmentProviders value.',
      )
    else if (injectorArguments[name])
      warn(
        node,
        `Review consumers of this ${name} reference for removed injector arguments${name === 'injectIsFetching' || name === 'injectIsMutating' ? ' and callback-based filters' : ''}.`,
      )
  }

  function migrateClientInjection(node: ts.CallExpression) {
    if (node.arguments.length !== 0) {
      warn(
        node,
        'Migrate injectQueryClient arguments manually using Angular inject or runInInjectionContext.',
      )
      return
    }
    const inject = imports.reference('inject', '@angular/core', node)
    const client = imports.reference('QueryClient', packageName, node)
    replace(node, `${inject}(${client})`)
  }

  function migrateActivityFilter(node: ts.CallExpression) {
    const first = node.arguments[0]
    if (!first) return
    if (ts.isObjectLiteralExpression(first)) {
      edits.push(
        {
          start: first.getStart(source),
          end: first.getStart(source),
          text: '() => (',
        },
        { start: first.end, end: first.end, text: ')' },
      )
    } else if (!ts.isArrowFunction(first) && !ts.isFunctionExpression(first))
      warn(first, 'Review activity filter: the stable API expects a callback.')
  }

  function visit(node: ts.Node) {
    if (
      ts.isStringLiteral(node) &&
      node.text.startsWith(OLD_PACKAGE) &&
      !ts.isImportDeclaration(node.parent) &&
      !ts.isExportDeclaration(node.parent)
    ) {
      warn(
        node,
        'Review this package reference manually (for example, a dynamic import or require).',
      )
    }
    if (ts.isCallExpression(node)) migrateCall(node)
    if (ts.isPropertyAccessExpression(node) || ts.isQualifiedName(node)) {
      const name = apiName(node)
      if (name) {
        warnRemovedApi(node, name)
        if (ts.isPropertyAccessExpression(node)) {
          if (renames[name]) replace(node.name, renames[name])
          warnAboutIndirectReference(node, name)
        }
      }
    }
    if (
      ts.isIdentifier(node) &&
      !ts.isImportSpecifier(node.parent) &&
      !ts.isPropertyAccessExpression(node.parent) &&
      !ts.isQualifiedName(node.parent) &&
      !ts.isTypeReferenceNode(node.parent)
    ) {
      const name = apiName(node)
      if (name) warnAboutIndirectReference(node, name)
    }
    if (
      ts.isTypeReferenceNode(node) &&
      apiName(node.typeName) === 'QueryFeature' &&
      node.typeArguments?.length
    )
      warn(
        node,
        'QueryFeature is no longer generic. Remove its type arguments and use features returned by the supported with* functions.',
      )
    if (
      ts.isNewExpression(node) &&
      apiName(node.expression) === 'QueryClient'
    ) {
      const defaults = propertyValue(node.arguments?.[0], 'defaultOptions')
      warnAboutObserverOptions(propertyValue(defaults, 'queries'))
      warnAboutObserverOptions(propertyValue(defaults, 'mutations'))
    }
    ts.forEachChild(node, visit)
  }
  migrateImports()
  visit(source)
  const newImports = imports.render()
  if (newImports) {
    // Insert after existing statements' leading comments (and a possible shebang).
    const position = source.statements[0]?.getStart(source) ?? text.length
    edits.push({ start: position, end: position, text: newImports })
  }
  let output = text
  for (const edit of edits.sort((a, b) => b.start - a.start || b.end - a.end))
    output = output.slice(0, edit.start) + edit.text + output.slice(edit.end)
  return { text: output, needsDevtools: result.needsDevtools }
}

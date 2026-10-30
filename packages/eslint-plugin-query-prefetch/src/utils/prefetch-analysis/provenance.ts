import {
  AST_NODE_TYPES,
  ASTUtils as TSESLintASTUtils,
} from '@typescript-eslint/utils'
import { ASTUtils } from '../ast-utils'
import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import type { ModuleExport, ModuleFile, ModuleGraph } from './module-graph'

/**
 * Where a value comes from, described without referring to where it's used, so a value computed in
 * a component and one computed in a loader, possibly in different files, can be compared.
 */
export type Provenance =
  /** A value the routing environment provides, such as route params or search params. */
  | { type: 'binding'; name: string }
  /**
   * A module-level value, identified by the module that declares it and its exported name, and the
   * first `'use client'` file it was re-exported through, which isn't part of its identity.
   */
  | { type: 'static'; module: string; name: string; clientModule?: string }
  /** A global, such as `Number` or `undefined`. */
  | { type: 'global'; name: string }
  | { type: 'literal'; value: string }
  | { type: 'member'; object: Provenance; property: string }
  | { type: 'call'; callee: Provenance; args: Array<Provenance> }
  /**
   * An object with known properties. Properties whose value can't be tracked are `null`. Reading a
   * property that isn't listed gives `undefined`, unless the object is `open`, in which case it
   * can't be tracked.
   */
  | {
      type: 'object'
      properties: Array<[string, Provenance | null]>
      open?: boolean
    }
  | { type: 'operation'; operator: string; operands: Array<Provenance> }

/**
 * A function declaration, function expression, or arrow function.
 */
export type FunctionNode =
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression

/**
 * What the routing environment knows about the code being analyzed.
 */
export interface ProvenanceEnvironment {
  /** The files being analyzed, used to resolve variables and imports. */
  graph: ModuleGraph
  /**
   * Maps a call to the value the environment provides, e.g. `Route.useParams()`.
   * @returns The value's provenance, `null` if it can't be tracked, or `undefined` if the call isn't
   * one the environment provides.
   */
  resolveCall: (node: TSESTree.CallExpression) => Provenance | null | undefined
  /**
   * Rewrites a value into the form the environment uses for it, e.g. `new URL(request.url).searchParams`
   * into the search params.
   * @returns The rewritten provenance, or `undefined` to keep it.
   */
  normalize?: (provenance: Provenance) => Provenance | undefined
  /**
   * The values the environment passes as the parameters of known functions, e.g. a loader's context
   * or a component's props.
   */
  parameterBindings: Map<FunctionNode, Array<Provenance | null>>
}

type Seen = Set<TSESLint.Scope.Variable>

type PatternStep =
  | { type: 'property'; name: string }
  | { type: 'default'; value: TSESTree.Expression }

const undefinedValue: Provenance = { type: 'global', name: 'undefined' }

/**
 * Describes where the value of an expression comes from.
 * @param node - The expression to describe.
 * @param env - The routing environment, which provides route values like params.
 * @returns The expression's provenance, or `null` if it depends on something that only exists at
 * render time, such as component state.
 */
export function getProvenance(
  node: TSESTree.Node,
  env: ProvenanceEnvironment,
): Provenance | null {
  const provenance = getPartialProvenance(node, env, new Set())
  return provenance !== null && isTracked(provenance) ? provenance : null
}

/**
 * Describes where the value of an expression comes from, keeping objects some of whose properties
 * can't be tracked, so the properties that can are still available, e.g. the value a loader returns.
 * @param node - The expression to describe.
 * @param env - The routing environment.
 * @returns The expression's provenance, or `null` if it can't be tracked.
 */
export function getValueProvenance(
  node: TSESTree.Node,
  env: ProvenanceEnvironment,
): Provenance | null {
  return getPartialProvenance(node, env, new Set())
}

/**
 * Describes where the value of an expression comes from, keeping objects some of whose properties
 * can't be tracked, so the properties that can are still available.
 * @param node - The expression to describe.
 * @param env - The routing environment.
 * @param seen - The variables being resolved, to stop on circular references.
 * @returns The expression's provenance, or `null` if it can't be tracked.
 */
function getPartialProvenance(
  node: TSESTree.Node,
  env: ProvenanceEnvironment,
  seen: Seen,
): Provenance | null {
  const get = (child: TSESTree.Node) => getPartialProvenance(child, env, seen)
  const normalize = (provenance: Provenance | null) =>
    provenance === null ? null : (env.normalize?.(provenance) ?? provenance)

  switch (node.type) {
    case AST_NODE_TYPES.Literal:
      return {
        type: 'literal',
        value:
          'regex' in node ? node.raw : `${typeof node.value}:${node.value}`,
      }
    case AST_NODE_TYPES.TemplateLiteral:
      return operation(
        'template',
        node.quasis.flatMap((quasi, index) => {
          const text: Provenance = {
            type: 'literal',
            value: `string:${quasi.value.cooked}`,
          }
          const expression = node.expressions[index]
          return expression === undefined ? [text] : [text, get(expression)]
        }),
      )
    case AST_NODE_TYPES.Identifier:
      return getIdentifierProvenance(node, env, seen)
    case AST_NODE_TYPES.MemberExpression: {
      const object = get(node.object)
      if (object === null) {
        return null
      }
      if (!node.computed && node.property.type === AST_NODE_TYPES.Identifier) {
        return normalize(member(object, node.property.name))
      }
      if (node.property.type === AST_NODE_TYPES.Literal) {
        return normalize(member(object, String(node.property.value)))
      }
      return operation('[]', [object, get(node.property)])
    }
    case AST_NODE_TYPES.ChainExpression:
    case AST_NODE_TYPES.TSAsExpression:
    case AST_NODE_TYPES.TSNonNullExpression:
    case AST_NODE_TYPES.TSSatisfiesExpression:
    case AST_NODE_TYPES.TSTypeAssertion:
      return get(node.expression)
    // Awaiting a value is the same as using it: Next.js passes `params` as a promise in newer versions
    // and as an object in older ones.
    case AST_NODE_TYPES.AwaitExpression:
      return get(node.argument)
    case AST_NODE_TYPES.CallExpression: {
      const provided = env.resolveCall(node)
      if (provided !== undefined) {
        return provided
      }
      const [firstArgument] = node.arguments
      // `use(params)` unwraps a promise, like `await`.
      if (
        firstArgument !== undefined &&
        firstArgument.type !== AST_NODE_TYPES.SpreadElement &&
        isReactUse(node.callee, env)
      ) {
        return get(firstArgument)
      }
      // Hooks return values that only exist at render time, like state.
      if (isHookCall(node)) {
        return null
      }
      const callee = get(node.callee)
      const args = node.arguments.map((arg) =>
        arg.type === AST_NODE_TYPES.SpreadElement ? null : get(arg),
      )
      if (callee === null || !isComplete(args)) {
        return null
      }
      return normalize({ type: 'call', callee, args })
    }
    case AST_NODE_TYPES.NewExpression:
      return normalize(
        operation('new', [
          get(node.callee),
          ...node.arguments.map((arg) =>
            arg.type === AST_NODE_TYPES.SpreadElement ? null : get(arg),
          ),
        ]),
      )
    case AST_NODE_TYPES.BinaryExpression:
    case AST_NODE_TYPES.LogicalExpression:
      if (node.left.type === AST_NODE_TYPES.PrivateIdentifier) {
        return null
      }
      return operation(node.operator, [get(node.left), get(node.right)])
    case AST_NODE_TYPES.UnaryExpression:
      if (node.operator === 'delete') {
        return null
      }
      return operation(node.operator, [get(node.argument)])
    case AST_NODE_TYPES.ConditionalExpression:
      return operation('?:', [
        get(node.test),
        get(node.consequent),
        get(node.alternate),
      ])
    case AST_NODE_TYPES.ArrayExpression:
      return operation(
        'array',
        node.elements.map((element) => {
          if (element === null) {
            return { type: 'literal', value: 'hole' }
          }
          if (element.type === AST_NODE_TYPES.SpreadElement) {
            return operation('...', [get(element.argument)])
          }
          return get(element)
        }),
      )
    case AST_NODE_TYPES.ObjectExpression: {
      const properties: Array<[string, Provenance | null]> = []
      for (const property of node.properties) {
        if (
          property.type !== AST_NODE_TYPES.Property ||
          property.kind !== 'init' ||
          property.method
        ) {
          return null
        }
        const key = getStaticKey(property)
        if (key === null) {
          return null
        }
        properties.push([key, get(property.value)])
      }
      return { type: 'object', properties }
    }
    default:
      return null
  }
}

/**
 * Serializes a provenance into a string that is equal for equal provenances, so provenances can be
 * compared and stored in sets.
 * @param provenance - The provenance to serialize.
 * @returns The serialized provenance.
 */
export function serializeProvenance(provenance: Provenance): string {
  return JSON.stringify(provenance, (key, value: unknown) =>
    key === 'clientModule' ? undefined : value,
  )
}

/**
 * Builds the provenance of a property access, reading the property directly when the object is a
 * known object literal.
 * @param object - The provenance of the object the property is read from.
 * @param property - The name of the property that is read.
 * @returns The property's provenance, or `null` if it can't be tracked.
 */
function member(object: Provenance, property: string): Provenance | null {
  if (object.type === 'object') {
    const found = object.properties.find(([key]) => key === property)
    if (found !== undefined) {
      return found[1]
    }
    return object.open ? null : undefinedValue
  }
  // `import * as queries from './queries'` then `queries.postOptions`
  if (object.type === 'static' && object.name === '*') {
    return {
      type: 'static',
      module: object.module,
      name: property,
      ...(object.clientModule && { clientModule: object.clientModule }),
    }
  }
  return { type: 'member', object, property }
}

/**
 * Returns the expression a function returns: its expression body, or the argument of its only
 * `return` statement.
 * @param node - The function to read the returned expression of.
 * @returns The returned expression, or `null` if the function doesn't have exactly one.
 */
export function getReturnedExpression(
  node: FunctionNode,
): TSESTree.Expression | null {
  if (node.body.type !== AST_NODE_TYPES.BlockStatement) {
    return node.body
  }
  const returns: Array<TSESTree.ReturnStatement> = []
  const stack: Array<TSESTree.Node> = [...node.body.body]
  while (stack.length > 0) {
    const current = stack.pop()!
    if (current.type === AST_NODE_TYPES.ReturnStatement) {
      returns.push(current)
      continue
    }
    if (isFunctionNode(current)) {
      continue
    }
    for (const value of Object.values(current)) {
      for (const child of Array.isArray(value) ? value : [value]) {
        if (isNode(child) && child !== current.parent) {
          stack.push(child)
        }
      }
    }
  }
  const [only] = returns
  return returns.length === 1 && only?.argument ? only.argument : null
}

/**
 * Checks whether a node is a function.
 * @param node - The node to check, which may be missing.
 * @returns `true` for function declarations, function expressions, and arrow functions.
 */
export function isFunctionNode(
  node: TSESTree.Node | null | undefined,
): node is FunctionNode {
  return (
    node?.type === AST_NODE_TYPES.ArrowFunctionExpression ||
    node?.type === AST_NODE_TYPES.FunctionDeclaration ||
    node?.type === AST_NODE_TYPES.FunctionExpression
  )
}

/**
 * Finds the variable a name refers to from a given place in the code.
 * @param graph - The module graph, used to find the node's file.
 * @param node - The identifier to resolve, or the node to look `name` up from.
 * @param name - The name to look up, if `node` isn't the identifier itself.
 * @returns The variable, or `null` if it is an undeclared global.
 */
export function findVariable(
  graph: ModuleGraph,
  node: TSESTree.Node,
  name?: string,
): TSESLint.Scope.Variable | null {
  const nameOrNode =
    name ?? (node.type === AST_NODE_TYPES.Identifier ? node : null)
  if (nameOrNode === null) {
    return null
  }
  return TSESLintASTUtils.findVariable(
    graph.fileOf(node).source.getScope(node),
    nameOrNode,
  )
}

/**
 * Checks whether a variable is declared at the top level of the module.
 * @param variable - The variable to check.
 * @returns `true` for module-level variables and imports.
 */
export function isModuleLevel(variable: TSESLint.Scope.Variable): boolean {
  return variable.scope.type === 'module' || variable.scope.type === 'global'
}

/**
 * Returns the module and name an identifier was imported from, as written in the import.
 * @param graph - The module graph, used to resolve the identifier.
 * @param node - The identifier that may refer to an import.
 * @returns The import's specifier and imported name, or `null` if the identifier isn't a named import.
 */
export function getImport(
  graph: ModuleGraph,
  node: TSESTree.Identifier,
): { source: string; name: string } | null {
  const definition = findVariable(graph, node)?.defs[0]
  if (
    definition?.type !== 'ImportBinding' ||
    definition.node.type !== AST_NODE_TYPES.ImportSpecifier ||
    definition.parent.type !== AST_NODE_TYPES.ImportDeclaration
  ) {
    return null
  }
  const imported = definition.node.imported
  return {
    source: definition.parent.source.value,
    name:
      imported.type === AST_NODE_TYPES.Identifier
        ? imported.name
        : imported.value,
  }
}

/**
 * A function and the file that declares it.
 */
export interface ResolvedFunction {
  /** The function node. */
  fn: FunctionNode
  /** The file that declares the function, which may be imported by the file being linted. */
  file: ModuleFile
}

/**
 * Finds the function an identifier refers to: a function declared in the same file, or one imported
 * from a file of the project. Functions wrapped in `memo()` or `forwardRef()` are unwrapped.
 * @param graph - The module graph, used to resolve the identifier and load imported files.
 * @param node - The identifier, e.g. the name of a rendered component or a called hook.
 * @returns The function and its file, or `null` if it can't be found.
 */
export function resolveFunction(
  graph: ModuleGraph,
  node: TSESTree.Identifier,
): ResolvedFunction | null {
  const variable = findVariable(graph, node)
  if (variable === null || !isModuleLevel(variable)) {
    return null
  }
  const definition = variable.defs[0]

  if (definition?.type === 'FunctionName' && isFunctionNode(definition.node)) {
    return { fn: definition.node, file: graph.fileOf(definition.node) }
  }

  if (definition?.type === 'Variable' && definition.parent.kind === 'const') {
    const lazyImport = getLazyImport(graph, definition.node.init)
    if (lazyImport !== null) {
      const found = graph.findExport(lazyImport.module, lazyImport.name)
      const fn = unwrapComponent(found?.node)
      return fn && found ? { fn, file: found.file } : null
    }
    const fn = unwrapComponent(definition.node.init)
    return fn && { fn, file: graph.fileOf(fn) }
  }

  if (definition?.type === 'ImportBinding') {
    const exported = graph.identify(variable)
    const found = graph.findExport(exported.module, exported.name)
    const fn = unwrapComponent(found?.node)
    return fn && found ? { fn, file: found.file } : null
  }

  return null
}

/**
 * Reads the export a dynamic import loads, as in `lazy(() => import('./post'))`,
 * `dynamic(() => import('./post').then((mod) => mod.Post))`, or `() => import('./post')`.
 * @param graph - The module graph, used to resolve the import specifier.
 * @param node - The `lazy()` or `dynamic()` call, or the function that imports the module.
 * @returns The imported module and export, `default` unless `.then()` picks another one, or `null`
 * if the node doesn't import a module.
 */
export function getLazyImport(
  graph: ModuleGraph,
  node: TSESTree.Node | null | undefined,
): ModuleExport | null {
  if (
    node?.type === AST_NODE_TYPES.CallExpression &&
    node.callee.type === AST_NODE_TYPES.Identifier &&
    (node.callee.name === 'lazy' || node.callee.name === 'dynamic')
  ) {
    return getLazyImport(graph, node.arguments[0])
  }
  if (!isFunctionNode(node)) {
    return null
  }

  let returned = getReturnedExpression(node)
  let name = 'default'
  // `import('./post').then((mod) => mod.Post)` or `.then((mod) => ({ default: mod.Post }))`
  if (
    returned?.type === AST_NODE_TYPES.CallExpression &&
    returned.callee.type === AST_NODE_TYPES.MemberExpression &&
    returned.callee.property.type === AST_NODE_TYPES.Identifier &&
    returned.callee.property.name === 'then' &&
    isFunctionNode(returned.arguments[0])
  ) {
    let picked = getReturnedExpression(returned.arguments[0])
    if (picked?.type === AST_NODE_TYPES.ObjectExpression) {
      picked =
        (ASTUtils.findPropertyWithIdentifierKey(picked.properties, 'default')
          ?.value as TSESTree.Expression | undefined) ?? null
    }
    if (
      picked?.type !== AST_NODE_TYPES.MemberExpression ||
      picked.property.type !== AST_NODE_TYPES.Identifier
    ) {
      return null
    }
    name = picked.property.name
    returned = returned.callee.object
  }

  const source =
    returned?.type === AST_NODE_TYPES.ImportExpression
      ? returned.source
      : undefined
  return source?.type === AST_NODE_TYPES.Literal &&
    typeof source.value === 'string'
    ? {
        module: graph.moduleId(source.value, graph.fileOf(source).path),
        name,
      }
    : null
}

/**
 * Finds the function a route option refers to: an inline function, a function declared in the same
 * file or imported, or the function returned by a call like `loader: postLoader(queryClient)`.
 * @param graph - The module graph, used to resolve identifiers and load imported files.
 * @param node - The option's value.
 * @returns The function and its file, or `null` if it can't be found.
 */
export function resolveFunctionValue(
  graph: ModuleGraph,
  node: TSESTree.Node,
): ResolvedFunction | null {
  if (isFunctionNode(node)) {
    return { fn: node, file: graph.fileOf(node) }
  }
  if (node.type === AST_NODE_TYPES.Identifier) {
    return resolveFunction(graph, node)
  }
  if (
    node.type === AST_NODE_TYPES.CallExpression &&
    node.callee.type === AST_NODE_TYPES.Identifier
  ) {
    const factory = resolveFunction(graph, node.callee)
    const returned = factory && getReturnedExpression(factory.fn)
    return isFunctionNode(returned)
      ? { fn: returned, file: factory!.file }
      : null
  }
  return null
}

/**
 * Returns the function a value defines, unwrapping `memo()` and `forwardRef()`.
 * @param node - The value, e.g. a variable's initializer or an exported declaration.
 * @returns The function, or `null` if the value isn't one.
 */
export function unwrapComponent(
  node: TSESTree.Node | null | undefined,
): FunctionNode | null {
  if (isFunctionNode(node)) {
    return node
  }
  if (node?.type === AST_NODE_TYPES.CallExpression) {
    const callee =
      node.callee.type === AST_NODE_TYPES.MemberExpression
        ? node.callee.property
        : node.callee
    if (
      callee.type === AST_NODE_TYPES.Identifier &&
      (callee.name === 'memo' || callee.name === 'forwardRef')
    ) {
      return unwrapComponent(node.arguments[0])
    }
  }
  return null
}

/**
 * Calls a visitor for a node and all of its descendants.
 * @param graph - The module graph, used for the visitor keys of the node's file.
 * @param root - The node to start from.
 * @param visit - The function called with each node. Returning `false` skips the node's children.
 */
export function walk(
  graph: ModuleGraph,
  root: TSESTree.Node,
  visit: (node: TSESTree.Node) => boolean | void,
): void {
  const { visitorKeys } = graph.fileOf(root).source
  const stack: Array<TSESTree.Node> = [root]
  while (stack.length > 0) {
    const node = stack.pop()!
    if (visit(node) === false) {
      continue
    }
    const keys = visitorKeys[node.type] ?? []
    // Push children in reverse, so they are visited in source order.
    for (let index = keys.length - 1; index >= 0; index--) {
      const child = (node as unknown as Record<string, unknown>)[keys[index]!]
      const values = Array.isArray(child) ? child : [child]
      for (let i = values.length - 1; i >= 0; i--) {
        const value: unknown = values[i]
        if (isNode(value)) {
          stack.push(value)
        }
      }
    }
  }
}

/**
 * Checks whether a call calls a hook, by the `use` naming convention.
 * @param node - The call to check.
 * @returns `true` if the called function or method is named like a hook.
 */
export function isHookCall(node: TSESTree.CallExpression): boolean {
  const callee =
    node.callee.type === AST_NODE_TYPES.MemberExpression
      ? node.callee.property
      : node.callee
  return (
    callee.type === AST_NODE_TYPES.Identifier && /^use[A-Z]/.test(callee.name)
  )
}

/**
 * Checks whether a provenance can be tracked completely, including the properties of the objects it
 * contains.
 * @param provenance - The provenance to check.
 * @returns `true` if no part of it is `null`.
 */
function isTracked(provenance: Provenance): boolean {
  switch (provenance.type) {
    case 'object':
      return provenance.properties.every(
        ([, value]) => value !== null && isTracked(value),
      )
    case 'member':
      return isTracked(provenance.object)
    case 'call':
      return isTracked(provenance.callee) && provenance.args.every(isTracked)
    case 'operation':
      return provenance.operands.every(isTracked)
    default:
      return true
  }
}

/**
 * Checks whether a callee is React's `use`.
 * @param callee - The callee of a call.
 * @param env - The routing environment, used to resolve the callee.
 * @returns `true` for `use` imported from `react`.
 */
function isReactUse(
  callee: TSESTree.Expression,
  env: ProvenanceEnvironment,
): boolean {
  return (
    callee.type === AST_NODE_TYPES.Identifier &&
    callee.name === 'use' &&
    getImport(env.graph, callee)?.source === 'react'
  )
}

/**
 * Checks whether a value is an AST node.
 * @param value - A property value of an AST node.
 * @returns `true` if the value has a string `type`.
 */
function isNode(value: unknown): value is TSESTree.Node {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { type?: unknown }).type === 'string'
  )
}

/**
 * Describes where the value of a variable reference comes from, following `const` initializers,
 * destructuring, and parameters the environment knows the value of.
 * @param node - The identifier referencing the variable.
 * @param env - The routing environment.
 * @param seen - The variables being resolved, to stop on circular references.
 * @returns The variable's provenance, or `null` if it can't be tracked.
 */
function getIdentifierProvenance(
  node: TSESTree.Identifier,
  env: ProvenanceEnvironment,
  seen: Seen,
): Provenance | null {
  const variable = findVariable(env.graph, node)

  if (variable === null || variable.defs.length === 0) {
    return { type: 'global', name: node.name }
  }

  if (isModuleLevel(variable)) {
    return (
      getConstantLiteral(env.graph, variable) ?? {
        type: 'static',
        ...env.graph.identify(variable),
      }
    )
  }

  if (
    seen.has(variable) ||
    variable.defs.length > 1 ||
    variable.references.some(
      (reference) => reference.isWrite() && !reference.init,
    )
  ) {
    return null
  }

  seen.add(variable)
  try {
    return getDefinitionProvenance(variable.defs[0]!, env, seen)
  } finally {
    seen.delete(variable)
  }
}

/**
 * Returns the value of a module-level constant initialized with a string, number, or boolean, so
 * `const FEATURED = 'featured'` matches the literal `'featured'`.
 * @param graph - The module graph, used to follow imports of the constant.
 * @param variable - The module-level variable.
 * @returns The literal's provenance, or `null` if the variable isn't such a constant.
 */
function getConstantLiteral(
  graph: ModuleGraph,
  variable: TSESLint.Scope.Variable,
): Provenance | null {
  const definition = variable.defs[0]
  let init: TSESTree.Node | null | undefined
  if (definition?.type === 'Variable' && definition.parent.kind === 'const') {
    init = definition.node.id === definition.name ? definition.node.init : null
  } else if (definition?.type === 'ImportBinding') {
    const exported = graph.identify(variable)
    const found = graph.findExport(exported.module, exported.name)
    const declarator = found?.node.parent
    init =
      declarator?.type === AST_NODE_TYPES.VariableDeclarator &&
      declarator.parent.kind === 'const'
        ? found?.node
        : null
  }
  while (
    init?.type === AST_NODE_TYPES.TSAsExpression ||
    init?.type === AST_NODE_TYPES.TSSatisfiesExpression
  ) {
    init = init.expression
  }
  if (
    init?.type === AST_NODE_TYPES.Literal &&
    !('regex' in init) &&
    !('bigint' in init) &&
    init.value !== null
  ) {
    return { type: 'literal', value: `${typeof init.value}:${init.value}` }
  }
  if (
    init?.type === AST_NODE_TYPES.TemplateLiteral &&
    init.expressions.length === 0
  ) {
    return {
      type: 'operation',
      operator: 'template',
      operands: [
        { type: 'literal', value: `string:${init.quasis[0]?.value.cooked}` },
      ],
    }
  }
  return null
}

/**
 * Describes where the value of a local variable comes from, given its definition.
 * @param definition - The definition of the variable.
 * @param env - The routing environment.
 * @param seen - The variables being resolved, to stop on circular references.
 * @returns The variable's provenance, or `null` for anything but a `const` or a known parameter.
 */
function getDefinitionProvenance(
  definition: TSESLint.Scope.Definition,
  env: ProvenanceEnvironment,
  seen: Seen,
): Provenance | null {
  if (
    definition.type === 'Variable' &&
    definition.parent.kind === 'const' &&
    definition.node.init !== null
  ) {
    const steps = findPatternSteps(definition.node.id, definition.name)
    const init = getPartialProvenance(definition.node.init, env, seen)
    return applySteps(init, steps, env, seen)
  }

  if (definition.type === 'Parameter' && isFunctionNode(definition.node)) {
    const bindings = env.parameterBindings.get(definition.node)
    for (const [index, parameter] of definition.node.params.entries()) {
      const steps = findPatternSteps(parameter, definition.name)
      if (steps !== undefined) {
        return applySteps(bindings?.[index] ?? null, steps, env, seen)
      }
    }
  }

  return null
}

/**
 * Finds the destructuring steps from a pattern to one of the identifiers it declares, e.g.
 * `{ params: { id } }` reaches `id` through the `params` and `id` properties.
 * @param pattern - The declaration's pattern, or a nested part of it.
 * @param target - The declared identifier to find.
 * @returns The steps, `undefined` if the pattern doesn't contain the identifier, or `null` if it
 * does through a construct that isn't tracked, such as a rest element.
 */
function findPatternSteps(
  pattern: TSESTree.Node,
  target: TSESTree.Node,
): Array<PatternStep> | null | undefined {
  if (pattern === target) {
    return []
  }

  switch (pattern.type) {
    case AST_NODE_TYPES.AssignmentPattern: {
      const steps = findPatternSteps(pattern.left, target)
      return steps && [{ type: 'default', value: pattern.right }, ...steps]
    }
    case AST_NODE_TYPES.TSParameterProperty:
      return findPatternSteps(pattern.parameter, target)
    case AST_NODE_TYPES.ObjectPattern:
      for (const property of pattern.properties) {
        if (property.type === AST_NODE_TYPES.RestElement) {
          if (findPatternSteps(property.argument, target) !== undefined) {
            return null
          }
          continue
        }
        const steps = findPatternSteps(property.value, target)
        if (steps !== undefined) {
          const key = getStaticKey(property)
          return steps && key !== null
            ? [{ type: 'property', name: key }, ...steps]
            : null
        }
      }
      return undefined
    case AST_NODE_TYPES.ArrayPattern:
      for (const [index, element] of pattern.elements.entries()) {
        if (element === null) {
          continue
        }
        const steps = findPatternSteps(element, target)
        if (steps !== undefined) {
          return steps && element.type !== AST_NODE_TYPES.RestElement
            ? [{ type: 'property', name: String(index) }, ...steps]
            : null
        }
      }
      return undefined
    case AST_NODE_TYPES.RestElement:
      return findPatternSteps(pattern.argument, target) === undefined
        ? undefined
        : null
    default:
      return undefined
  }
}

/**
 * Applies destructuring steps to the provenance of the destructured value.
 * @param provenance - The provenance of the destructured value.
 * @param steps - The steps from `findPatternSteps`.
 * @param env - The routing environment, used for default values.
 * @param seen - The variables being resolved, to stop on circular references.
 * @returns The provenance of the declared identifier, or `null` if it can't be tracked.
 */
function applySteps(
  provenance: Provenance | null,
  steps: Array<PatternStep> | null | undefined,
  env: ProvenanceEnvironment,
  seen: Seen,
): Provenance | null {
  if (!steps) {
    return null
  }

  let current = provenance
  for (const step of steps) {
    if (current === null) {
      return null
    }
    if (step.type === 'property') {
      current = member(current, step.name)
    } else if (current.type === 'global' && current.name === 'undefined') {
      // A default for a value that is known to be missing, like an optional prop that isn't passed.
      current = getPartialProvenance(step.value, env, seen)
    } else {
      current = operation('default', [
        current,
        getPartialProvenance(step.value, env, seen),
      ])
    }
  }
  return current
}

/**
 * Returns the name of a property key that doesn't need to be evaluated.
 * @param property - An object literal property or destructuring property.
 * @returns The key's name, or `null` for computed keys that aren't literals.
 */
function getStaticKey(property: TSESTree.Property): string | null {
  if (!property.computed && property.key.type === AST_NODE_TYPES.Identifier) {
    return property.key.name
  }
  if (property.key.type === AST_NODE_TYPES.Literal) {
    return String(property.key.value)
  }
  return null
}

/**
 * Builds the provenance of an operation on other values.
 * @param operator - A name for the operation, such as `+` or `template`.
 * @param operands - The provenances of the values the operation uses.
 * @returns The operation's provenance, or `null` if any operand can't be tracked.
 */
function operation(
  operator: string,
  operands: Array<Provenance | null>,
): Provenance | null {
  return isComplete(operands) ? { type: 'operation', operator, operands } : null
}

/**
 * Checks whether every provenance in a list could be tracked completely.
 * @param values - The provenances to check.
 * @returns `true` if none of them is or contains `null`.
 */
function isComplete(
  values: Array<Provenance | null>,
): values is Array<Provenance> {
  return values.every((value) => value !== null && isTracked(value))
}

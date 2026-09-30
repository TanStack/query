import ts from 'typescript'

/** Reuse visible value imports; add ordinary named imports only when needed. */
export class MigrationImports {
  private readonly usedNames = new Set<string>()
  private readonly additions: Array<{
    name: string
    local: string
    module: string
  }> = []
  private readonly existing: Array<{
    name?: string
    local: ts.Identifier
    module: string
  }> = []

  constructor(
    source: ts.SourceFile,
    private readonly checker: ts.TypeChecker,
    normalizeModule: (module: string) => string,
  ) {
    const collectNames = (node: ts.Node) => {
      if (ts.isIdentifier(node)) this.usedNames.add(node.text)
      ts.forEachChild(node, collectNames)
    }
    collectNames(source)
    for (const statement of source.statements) {
      if (
        !ts.isImportDeclaration(statement) ||
        !ts.isStringLiteral(statement.moduleSpecifier) ||
        statement.importClause?.isTypeOnly
      )
        continue
      const bindings = statement.importClause?.namedBindings
      const module = normalizeModule(statement.moduleSpecifier.text)
      if (bindings && ts.isNamespaceImport(bindings)) {
        this.existing.push({ local: bindings.name, module })
      } else if (bindings) {
        for (const element of bindings.elements) {
          if (!element.isTypeOnly)
            this.existing.push({
              name: (element.propertyName ?? element.name).text,
              local: element.name,
              module,
            })
        }
      }
    }
  }

  reference(name: string, module: string, location: ts.Node): string {
    for (const imported of this.existing) {
      if (
        imported.module !== module ||
        (imported.name && imported.name !== name)
      )
        continue
      const visible = this.checker.resolveName(
        imported.local.text,
        location,
        ts.SymbolFlags.Value | ts.SymbolFlags.Alias,
        false,
      )
      if (visible === this.checker.getSymbolAtLocation(imported.local)) {
        return imported.name
          ? imported.local.text
          : `${imported.local.text}.${name}`
      }
    }
    const added = this.additions.find(
      (entry) => entry.name === name && entry.module === module,
    )
    if (added) return added.local

    // Check all scopes so the new import cannot be shadowed at another call site.
    let local = name
    if (this.usedNames.has(local)) {
      const base = name === 'inject' ? 'angularInject' : 'TanStackQueryClient'
      local = base
      let suffix = 2
      while (this.usedNames.has(local)) local = `${base}${suffix++}`
    }
    this.usedNames.add(local)
    this.additions.push({ name, local, module })
    return local
  }

  render(): string {
    return this.additions
      .map(
        ({ name, local, module }) =>
          `import { ${name === local ? name : `${name} as ${local}`} } from '${module}';\n`,
      )
      .join('')
  }
}

import { addRootProvider } from '@schematics/angular/utility'
import {
  NodeDependencyType,
  addPackageJsonDependency,
} from '@schematics/angular/utility/dependencies'
import {
  getAppModulePath,
  isStandaloneApp,
} from '@schematics/angular/utility/ng-ast-utils'
import { findAppConfig } from '@schematics/angular/utility/standalone/app_config'
import {
  findBootstrapApplicationCall,
  getMainFilePath,
} from '@schematics/angular/utility/standalone/util'
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks'
import { chain } from '@angular-devkit/schematics'
import ts from 'typescript'
import type { Rule, Tree } from '@angular-devkit/schematics'
import type { Schema } from './schema'

// Replaced with package metadata by scripts/inject-schematic-package-info.js.
// The published schematic contains literal values and does not read package.json.
const PACKAGE_NAME = '__ANGULAR_QUERY_PACKAGE_NAME__'
const DEVTOOLS_PACKAGE_NAME = '__ANGULAR_QUERY_DEVTOOLS_PACKAGE_NAME__'
const DEVTOOLS_PACKAGE_VERSION = '__ANGULAR_QUERY_DEVTOOLS_PACKAGE_VERSION__'

function hasPackageDependency(tree: Tree, name: string) {
  const packageJsonPath = tree.exists('/package.json')
    ? '/package.json'
    : 'package.json'
  const packageJson = JSON.parse(tree.readText(packageJsonPath)) as Record<
    string,
    Record<string, string> | undefined
  >

  return ['dependencies', 'devDependencies', 'optionalDependencies'].some(
    (dependencyType) => packageJson[dependencyType]?.[name] !== undefined,
  )
}

function addDevtoolsDependency(): Rule {
  return (tree, context) => {
    if (hasPackageDependency(tree, DEVTOOLS_PACKAGE_NAME)) return tree

    addPackageJsonDependency(tree, {
      type: NodeDependencyType.Default,
      name: DEVTOOLS_PACKAGE_NAME,
      version: DEVTOOLS_PACKAGE_VERSION,
      overwrite: false,
    })
    context.addTask(new NodePackageInstallTask())
    return tree
  }
}

function hasProviderCall(tree: Tree, sourcePath: string) {
  const source = ts.createSourceFile(
    sourcePath,
    tree.readText(sourcePath),
    ts.ScriptTarget.Latest,
    true,
  )
  const localProviderNames = new Set<string>()

  for (const statement of source.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== PACKAGE_NAME ||
      !statement.importClause?.namedBindings ||
      !ts.isNamedImports(statement.importClause.namedBindings)
    ) {
      continue
    }

    for (const element of statement.importClause.namedBindings.elements) {
      if (
        (element.propertyName ?? element.name).text === 'provideTanStackQuery'
      ) {
        localProviderNames.add(element.name.text)
      }
    }
  }

  if (localProviderNames.size === 0) return false

  let found = false
  const visit = (node: ts.Node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      localProviderNames.has(node.expression.text)
    ) {
      found = true
      return
    }

    if (!found) ts.forEachChild(node, visit)
  }
  visit(source)
  return found
}

async function hasRootQueryProvider(tree: Tree, projectName: string) {
  const mainFilePath = await getMainFilePath(tree, projectName)
  const rootFilePath = isStandaloneApp(tree, mainFilePath)
    ? (findAppConfig(
        findBootstrapApplicationCall(tree, mainFilePath),
        tree,
        mainFilePath,
      )?.filePath ?? mainFilePath)
    : getAppModulePath(tree, mainFilePath)

  return hasProviderCall(tree, rootFilePath)
}

function addQueryProvider(project: string): Rule {
  return async (tree) => {
    if (await hasRootQueryProvider(tree, project)) return tree

    return addRootProvider(
      project,
      ({ code, external }) =>
        code`${external(
          'provideTanStackQuery',
          PACKAGE_NAME,
        )}(() => new ${external(
          'QueryClient',
          PACKAGE_NAME,
        )}(), ${external('withDevtools', DEVTOOLS_PACKAGE_NAME)}())`,
    )
  }
}

/**
 * Configures TanStack Query at the application root.
 *
 * The QueryClient factory is resolved by each root injector, preventing query
 * caches from being shared between SSR requests.
 */
export function ngAdd(options: Schema): Rule {
  return chain([addDevtoolsDependency(), addQueryProvider(options.project)])
}

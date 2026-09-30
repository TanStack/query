import {
  NodeDependencyType,
  addPackageJsonDependency,
  removePackageJsonDependency,
} from '@schematics/angular/utility/dependencies'
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks'
import { OLD_PACKAGE, migrateSource } from './source'
import { migrationWorkspace, sourceManifest } from './workspace'
import type { Rule, Tree } from '@angular-devkit/schematics'

const PACKAGE_NAME = '__ANGULAR_QUERY_PACKAGE_NAME__'
const PACKAGE_VERSION = '__ANGULAR_QUERY_PACKAGE_VERSION__'
const DEVTOOLS_PACKAGE_NAME = '__ANGULAR_QUERY_DEVTOOLS_PACKAGE_NAME__'
const DEVTOOLS_PACKAGE_VERSION = '__ANGULAR_QUERY_DEVTOOLS_PACKAGE_VERSION__'
const MIGRATION_GUIDE =
  'https://tanstack.com/query/latest/docs/framework/angular/guides/migrating-from-experimental'
const dependencyTypes = [
  NodeDependencyType.Default,
  NodeDependencyType.Dev,
  NodeDependencyType.Optional,
  NodeDependencyType.Peer,
]

/** Migrates syntactically unambiguous uses; reports cases requiring human review. */
export function migrate(options: { skipInstall?: boolean }): Rule {
  return async (tree, context) => {
    const workspace = await migrationWorkspace(tree)
    const devtoolsManifests = new Set<string>()
    let changedFiles = 0
    let reviewItems = 0
    const report = (message: string) => {
      reviewItems++
      context.logger.warn(message)
    }
    for (const path of workspace.files) {
      const text = tree.readText(path)
      if (!text.includes(OLD_PACKAGE) && !text.includes(PACKAGE_NAME)) continue
      const result = migrateSource(
        text,
        path,
        PACKAGE_NAME,
        DEVTOOLS_PACKAGE_NAME,
        report,
      )
      if (result.needsDevtools) {
        const manifest = sourceManifest(path, workspace.manifests)
        if (manifest) devtoolsManifests.add(manifest)
        else
          report(
            `${path}: Add ${DEVTOOLS_PACKAGE_NAME} to the package manifest manually.`,
          )
      }
      if (result.text !== text) {
        tree.overwrite(path, result.text)
        changedFiles++
      }
    }
    let packageChanges = 0
    for (const manifest of workspace.manifests)
      packageChanges += migrateDependencies(
        tree,
        manifest,
        devtoolsManifests.has(manifest),
        report,
      )
    if (packageChanges && !options.skipInstall)
      context.addTask(new NodePackageInstallTask())

    context.logger.info(
      `Angular Query migration prepared: ${changedFiles} source file(s) changed, ${packageChanges} dependency change(s), ${reviewItems} item(s) requiring manual review.`,
    )
    if (packageChanges)
      context.logger.info(
        options.skipInstall
          ? 'Dependency installation was skipped. Run your package manager install command after applying the migration.'
          : 'Dependency installation is scheduled after the migration is applied.',
      )
    context.logger.info(
      'Address the warnings, then run your application build, tests, linting, and formatting checks. Review SSR hydration, error handling, persistence factories, and tests waiting for stability. Angular >=20.1 is required.',
    )
    context.logger.info(`Migration guide: ${MIGRATION_GUIDE}`)
    return tree
  }
}

function migrateDependencies(
  tree: Tree,
  manifest: string,
  needsDevtools: boolean,
  report: (message: string) => void,
) {
  const pkg = tree.readJson(manifest) as Partial<
    Record<NodeDependencyType, Record<string, string | undefined>>
  >
  let changes = 0
  for (const type of dependencyTypes) {
    const dependencies = pkg[type]
    if (!dependencies?.[OLD_PACKAGE]) continue
    changes++
    if (!dependencies[PACKAGE_NAME]) {
      addPackageJsonDependency(
        tree,
        {
          type,
          name: PACKAGE_NAME,
          version: `^${PACKAGE_VERSION}`,
          overwrite: false,
        },
        manifest,
      )
      changes++
    }
  }
  if (changes) removePackageJsonDependency(tree, OLD_PACKAGE, manifest)
  if (
    needsDevtools &&
    !dependencyTypes.some((type) => pkg[type]?.[DEVTOOLS_PACKAGE_NAME])
  ) {
    const type =
      pkg.peerDependencies?.[OLD_PACKAGE] ||
      pkg.peerDependencies?.[PACKAGE_NAME]
        ? NodeDependencyType.Peer
        : NodeDependencyType.Default
    addPackageJsonDependency(
      tree,
      {
        type,
        name: DEVTOOLS_PACKAGE_NAME,
        version: `^${DEVTOOLS_PACKAGE_VERSION}`,
        overwrite: false,
      },
      manifest,
    )
    changes++
  }
  const metadata = tree.readJson(manifest) as {
    peerDependenciesMeta?: Record<string, unknown>
  }
  if (metadata.peerDependenciesMeta?.[OLD_PACKAGE])
    report(
      `${manifest}: Rename peerDependenciesMeta["${OLD_PACKAGE}"] to "${PACKAGE_NAME}" and review the optional peer configuration.`,
    )
  return changes
}

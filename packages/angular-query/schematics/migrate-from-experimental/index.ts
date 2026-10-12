import {
  NodeDependencyType,
  addPackageJsonDependency,
  removePackageJsonDependency,
} from '@schematics/angular/utility/dependencies'
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks'
import { CORE_PACKAGE, OLD_PACKAGE, migrateSource } from './source'
import {
  migrationWorkspace,
  packageReferenceFiles,
  sourceManifest,
} from './workspace'
import type { Schema } from './schema'
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

// TODO: Ideally remove migrate-from-experimental one year after Angular Query's
// first stable release, along with its collection entry, tests, and packaging references.

/** Migrates syntactically unambiguous uses; reports cases requiring human review. */
export function migrate(options: Schema): Rule {
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
      if (
        !text.includes(OLD_PACKAGE) &&
        !text.includes(PACKAGE_NAME) &&
        !(options.migrateQueryCoreImports && text.includes(CORE_PACKAGE))
      )
        continue
      const result = migrateSource(
        text,
        path,
        PACKAGE_NAME,
        DEVTOOLS_PACKAGE_NAME,
        report,
        options,
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
    const remainingCoreReferences = new Map<string, string>()
    if (options.migrateQueryCoreImports)
      for (const path of packageReferenceFiles(tree, CORE_PACKAGE)) {
        for (const manifest of workspace.manifests)
          if (sourceManifest(path, [manifest]))
            remainingCoreReferences.set(manifest, path)
      }
    let packageChanges = 0
    for (const manifest of workspace.manifests)
      packageChanges += migrateDependencies(
        tree,
        manifest,
        devtoolsManifests.has(manifest),
        report,
        options.migrateQueryCoreImports ?? false,
        remainingCoreReferences.get(manifest),
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
  migrateCore: boolean,
  remainingCoreReference?: string,
) {
  const pkg = tree.readJson(manifest) as Partial<
    Record<NodeDependencyType, Record<string, string | undefined>>
  >
  let changes = 0
  for (const type of dependencyTypes) {
    const dependencies = pkg[type]
    if (!dependencies) continue
    const experimental = dependencies[OLD_PACKAGE]
    const core = migrateCore && dependencies[CORE_PACKAGE]
    if (!experimental && !core) continue
    if (experimental) changes++
    if (core && !remainingCoreReference) changes++
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
  if (dependencyTypes.some((type) => pkg[type]?.[OLD_PACKAGE]))
    removePackageJsonDependency(tree, OLD_PACKAGE, manifest)
  const hasCoreDependency = dependencyTypes.some(
    (type) => pkg[type]?.[CORE_PACKAGE],
  )
  if (migrateCore && hasCoreDependency) {
    if (remainingCoreReference)
      report(
        `${manifest}: Keeping ${CORE_PACKAGE} because ${remainingCoreReference} still references it. Migrate remaining imports or references manually before removing the dependency.`,
      )
    else removePackageJsonDependency(tree, CORE_PACKAGE, manifest)
  }
  const current = tree.readJson(manifest) as typeof pkg
  if (
    needsDevtools &&
    !dependencyTypes.some((type) => pkg[type]?.[DEVTOOLS_PACKAGE_NAME])
  ) {
    const type = current.peerDependencies?.[PACKAGE_NAME]
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
  for (const name of [
    OLD_PACKAGE,
    ...(migrateCore && !remainingCoreReference ? [CORE_PACKAGE] : []),
  ])
    if (metadata.peerDependenciesMeta?.[name])
      report(
        `${manifest}: Rename peerDependenciesMeta["${name}"] to "${PACKAGE_NAME}" and review the optional peer configuration.`,
      )
  return changes
}

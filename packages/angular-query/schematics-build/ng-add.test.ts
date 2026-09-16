import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SchematicTestRunner } from '@angular-devkit/schematics/testing'
import angularQueryPackage from '../package.json' with { type: 'json' }

const require = createRequire(import.meta.url)
const angularRunner = new SchematicTestRunner(
  '@schematics/angular',
  resolve(
    dirname(require.resolve('@schematics/angular/package.json')),
    'collection.json',
  ),
)
const queryRunner = new SchematicTestRunner(
  angularQueryPackage.name,
  resolve('dist/schematics/collection.json'),
)

async function createAngularApplication(standalone = true) {
  let tree = await angularRunner.runSchematic('workspace', {
    name: 'workspace',
    version: '20.0.0',
    newProjectRoot: 'projects',
  })

  tree = await angularRunner.runSchematic(
    'application',
    {
      name: 'test-app',
      standalone,
      routing: false,
      style: 'css',
      skipInstall: true,
    },
    tree,
  )

  return tree
}

describe('ng-add schematic', () => {
  it('configures Angular Query and devtools', async () => {
    const tree = await createAngularApplication()
    const result = await queryRunner.runSchematic(
      'ng-add',
      { project: 'test-app' },
      tree,
    )
    const packageJson = JSON.parse(result.readContent('/package.json')) as {
      dependencies: Record<string, string>
    }
    const devtoolsPackageName = Object.keys(packageJson.dependencies).find(
      (packageName) => packageName.endsWith('/angular-query-devtools'),
    )
    const appConfig = result.readContent(
      '/projects/test-app/src/app/app.config.ts',
    )

    expect(devtoolsPackageName).toBeDefined()
    expect(appConfig).toContain(`from '${angularQueryPackage.name}'`)
    expect(appConfig).toContain(`from '${devtoolsPackageName}'`)
    expect(appConfig).toContain(
      'provideTanStackQuery(() => new QueryClient(), withDevtools())',
    )
    expect(queryRunner.tasks).toEqual([
      expect.objectContaining({ name: 'node-package' }),
    ])
  })

  it.each([
    { applicationType: 'standalone', standalone: true },
    { applicationType: 'NgModule', standalone: false },
  ])(
    'does not duplicate configuration in a $applicationType application',
    async ({ standalone }) => {
      const tree = await createAngularApplication(standalone)
      const firstResult = await queryRunner.runSchematic(
        'ng-add',
        { project: 'test-app' },
        tree,
      )
      const secondResult = await queryRunner.runSchematic(
        'ng-add',
        { project: 'test-app' },
        firstResult,
      )
      const applicationSources = secondResult.files
        .filter((filePath) => filePath.endsWith('.ts'))
        .map((filePath) => secondResult.readContent(filePath))
        .join('\n')

      expect(applicationSources.match(/provideTanStackQuery\(/g)).toHaveLength(
        1,
      )
      expect(applicationSources.match(/withDevtools\(\)/g)).toHaveLength(1)
      expect(queryRunner.tasks).toHaveLength(0)
    },
  )
})

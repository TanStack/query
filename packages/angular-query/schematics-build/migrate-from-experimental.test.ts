import { describe, expect, it } from 'vitest'
import packageJson from '../package.json' with { type: 'json' }
import {
  SchematicTestRunner,
  Tree,
  devtoolsPackage,
  queryCollection,
} from './test-utils'

// cspell:ignore packagr

function setup(source: string) {
  const runner = new SchematicTestRunner(packageJson.name, queryCollection)
  const tree = Tree.empty()
  tree.create('/src/app.ts', source)
  tree.create(
    '/package.json',
    JSON.stringify({
      dependencies: { '@tanstack/angular-query-experimental': '^5.0.0' },
    }),
  )
  const warnings: Array<string> = []
  const messages: Array<string> = []
  runner.logger.subscribe((entry) => {
    if (entry.level === 'warn') warnings.push(entry.message)
    if (entry.level === 'info') messages.push(entry.message)
  })
  return { runner, tree, warnings, messages }
}

describe('migrate-from-experimental', () => {
  it('migrates aliases, factories, spreads, filters, helpers and dependencies; is idempotent', async () => {
    const { runner, tree } =
      setup(`import { QueryClient as Client, provideAngularQuery as provide, injectQueryClient as client, injectIsFetching } from '@tanstack/angular-query-experimental';
import { withDevtools } from '@tanstack/angular-query-experimental/devtools/production';
const providers = [...provide(new Client(), withDevtools())];
const qc = client();
const count = injectIsFetching({ queryKey: ['todos'] });
function unrelated(provide: any, client: any) { provide(new Client()); client(); }
`)
    const result = await runner.runSchematic(
      'migrate-from-experimental',
      {},
      tree,
    )
    const output = result.readContent('/src/app.ts')
    expect(output).toContain('provideTanStackQuery as provide')
    expect(output).toContain(
      'providers = [provide(() => new Client(), withDevtools())]',
    )
    expect(output).toContain('inject(Client)')
    expect(output).toContain("import { inject } from '@angular/core'")
    expect(output).not.toContain('migrationCore')
    expect(output).not.toContain('injectQueryClient')
    expect(output).toContain(
      "injectIsFetching(() => ({ queryKey: ['todos'] }))",
    )
    expect(output).toContain('provide(new Client()); client();')
    expect(output).toContain(`${devtoolsPackage.name}/production`)
    expect(
      JSON.parse(result.readContent('/package.json')).dependencies,
    ).toEqual({
      [packageJson.name]: `^${packageJson.version}`,
      [devtoolsPackage.name]: `^${devtoolsPackage.version}`,
    })
    expect(runner.tasks).toHaveLength(1)
    const again = await runner.runSchematic(
      'migrate-from-experimental',
      {},
      result,
    )
    expect(again.readContent('/src/app.ts')).toBe(output)
    expect(runner.tasks).toHaveLength(0)
  })

  it('handles namespaces without touching shadowed bindings or existing factories', async () => {
    const { runner, tree } =
      setup(`import * as query from '@tanstack/angular-query-experimental';
query.provideAngularQuery(new query.QueryClient());
query.provideTanStackQuery(() => new query.QueryClient());
query.injectQueryClient();
function other(query: any) { query.provideAngularQuery(new query.QueryClient()); }
`)
    const result = await runner.runSchematic(
      'migrate-from-experimental',
      { skipInstall: true },
      tree,
    )
    const output = result.readContent('/src/app.ts')
    expect(
      output.match(
        /query.provideTanStackQuery\(\(\) => new query.QueryClient\(\)\)/g,
      ),
    ).toHaveLength(2)
    expect(output).toContain(
      'function other(query: any) { query.provideAngularQuery(new query.QueryClient()); }',
    )
    expect(runner.tasks).toHaveLength(0)
  })

  it('generates ordinary named imports when neither API is imported', async () => {
    const { runner, tree } =
      setup(`import { injectQueryClient } from '@tanstack/angular-query-experimental';
const client = injectQueryClient();`)
    const result = await runner.runSchematic(
      'migrate-from-experimental',
      {},
      tree,
    )
    const output = result.readContent('/src/app.ts')
    expect(output).toContain("import { inject } from '@angular/core';")
    expect(output).toContain(
      `import { QueryClient } from '${packageJson.name}';`,
    )
    expect(output).toContain('const client = inject(QueryClient);')
    expect(output).not.toContain('import {  }')
  })

  it('reuses existing aliased and namespace imports', async () => {
    const { runner, tree } =
      setup(`import { inject as angularInject } from '@angular/core';
import * as query from '@tanstack/angular-query-experimental';
const client = query.injectQueryClient();`)
    const result = await runner.runSchematic(
      'migrate-from-experimental',
      {},
      tree,
    )
    const output = result.readContent('/src/app.ts')
    expect(output).toContain('const client = angularInject(query.QueryClient);')
    expect(output.match(/import /g)).toHaveLength(2)
  })

  it('adds readable aliases when existing imports are shadowed', async () => {
    const { runner, tree } = setup(`import { inject } from '@angular/core';
import { QueryClient, injectQueryClient } from '@tanstack/angular-query-experimental';
function example(inject: unknown, QueryClient: unknown) { return injectQueryClient(); }
const client = injectQueryClient();`)
    const result = await runner.runSchematic(
      'migrate-from-experimental',
      {},
      tree,
    )
    const output = result.readContent('/src/app.ts')
    expect(output).toContain(
      "import { inject as angularInject } from '@angular/core';",
    )
    expect(output).toContain(
      `import { QueryClient as TanStackQueryClient } from '${packageJson.name}';`,
    )
    expect(output).toContain('return angularInject(TanStackQueryClient)')
    expect(output).toContain('const client = inject(QueryClient);')
    expect(output).not.toContain('import {  }')
    const again = await runner.runSchematic(
      'migrate-from-experimental',
      {},
      result,
    )
    expect(again.readContent('/src/app.ts')).toBe(output)
  })

  it('does not use type-only imports as runtime values and avoids alias collisions', async () => {
    const { runner, tree } =
      setup(`import type { QueryClient } from '@tanstack/angular-query-experimental';
import { injectQueryClient } from '@tanstack/angular-query-experimental';
const TanStackQueryClient = 'occupied';
const client = injectQueryClient();`)
    const result = await runner.runSchematic(
      'migrate-from-experimental',
      {},
      tree,
    )
    const output = result.readContent('/src/app.ts')
    expect(output).toContain(
      `import { QueryClient as TanStackQueryClient2 } from '${packageJson.name}';`,
    )
    expect(output).toContain('const client = inject(TanStackQueryClient2);')
  })

  it('reports ambiguous changes and preserves imperative error options', async () => {
    const { runner, tree, warnings } =
      setup(`import { provideTanStackQuery, injectQueries, injectIsMutating } from '@tanstack/angular-query-experimental';
provideTanStackQuery(client);
injectQueries(options, injector);
injectIsMutating(filters);
query.refetch({ throwOnError: true });
`)
    const result = await runner.runSchematic(
      'migrate-from-experimental',
      {},
      tree,
    )
    expect(result.readContent('/src/app.ts')).toContain(
      'provideTanStackQuery(client)',
    )
    expect(result.readContent('/src/app.ts')).toContain(
      'query.refetch({ throwOnError: true })',
    )
    expect(warnings.join('\n')).toContain('Client reference')
    expect(warnings.join('\n')).toContain('runInInjectionContext')
    expect(warnings.join('\n')).toContain('activity filter')
  })

  describe('removed injector arguments', () => {
    const helpers = [
      'injectQuery',
      'injectInfiniteQuery',
      'injectMutation',
      'injectMutationState',
      'injectIsFetching',
      'injectIsMutating',
      'injectIsRestoring',
      'injectQueries',
    ]

    it.each(helpers)(
      'warns for named, aliased and namespace calls to %s',
      async (helper) => {
        const args =
          helper === 'injectIsRestoring'
            ? '{ injector }'
            : helper === 'injectQueries'
              ? 'options, injector'
              : 'options, { injector }'
        const { runner, tree, warnings } =
          setup(`import { ${helper}, ${helper} as helper } from '@tanstack/angular-query-experimental';
import * as query from '@tanstack/angular-query-experimental';
${helper}(${args});
helper(${args});
query.${helper}(${args});`)
        const result = await runner.runSchematic(
          'migrate-from-experimental',
          {},
          tree,
        )
        const injectorWarnings = warnings.filter((warning) =>
          warning.includes('no longer accepts'),
        )
        expect(injectorWarnings).toHaveLength(3)
        expect(
          injectorWarnings.every(
            (warning) =>
              warning.includes(helper) &&
              warning.includes('runInInjectionContext'),
          ),
        ).toBe(true)
        expect(injectorWarnings[0]).toContain('/src/app.ts:3:')
        expect(injectorWarnings[0]).toContain(
          helper === 'injectQueries'
            ? 'old injector argument'
            : 'old options.injector',
        )
        expect(result.readContent('/src/app.ts')).toContain(`helper(${args})`)
      },
    )

    it.each(helpers)(
      'does not warn for current signatures or shadowed %s',
      async (helper) => {
        const args = helper === 'injectIsRestoring' ? '' : '() => ({})'
        const { runner, tree, warnings } =
          setup(`import { ${helper} } from '@tanstack/angular-query-experimental';
${helper}(${args});
function unrelated(${helper}: any) { ${helper}(options, { injector }); }`)
        await runner.runSchematic('migrate-from-experimental', {}, tree)
        expect(warnings).toEqual([])
      },
    )

    it('reports undefined options, optional injector objects and spread arguments', async () => {
      const { runner, tree, warnings } =
        setup(`import { injectQuery, injectMutation, injectIsRestoring } from '@tanstack/angular-query-experimental';
injectQuery(options, undefined);
injectMutation(options, {});
injectIsRestoring(injectionOptions);
injectQuery(...args);`)
      await runner.runSchematic('migrate-from-experimental', {}, tree)
      expect(warnings).toHaveLength(4)
      expect(warnings[0]).toContain(
        'If it is undefined or contains no injector',
      )
      expect(warnings[3]).toContain('Review spread arguments to injectQuery')
    })

    it.each(['injectIsFetching', 'injectIsMutating'])(
      'still wraps filters while warning about %s injector options',
      async (helper) => {
        const { runner, tree, warnings } =
          setup(`import { ${helper} } from '@tanstack/angular-query-experimental';
${helper}({}, { injector });`)
        const result = await runner.runSchematic(
          'migrate-from-experimental',
          {},
          tree,
        )
        expect(result.readContent('/src/app.ts')).toContain(
          `${helper}(() => ({}), { injector })`,
        )
        expect(warnings).toHaveLength(1)
        expect(warnings[0]).toContain('old options.injector')
      },
    )

    it.each([
      'InjectQueryOptions',
      'InjectInfiniteQueryOptions',
      'InjectMutationOptions',
      'InjectMutationStateOptions',
      'InjectIsFetchingOptions',
      'InjectIsMutatingOptions',
    ])('flags removed %s types used by wrappers', async (name) => {
      const { runner, tree, warnings } =
        setup(`import type { ${name} as Options } from '@tanstack/angular-query-experimental';
import type * as query from '@tanstack/angular-query-experimental';
let options: Options;
let other: query.${name};`)
      await runner.runSchematic('migrate-from-experimental', {}, tree)
      expect(
        warnings.filter((warning) => warning.includes(`${name} was removed`)),
      ).toHaveLength(2)
    })
  })

  it('preserves existing stable dependency versions and skips generated files', async () => {
    const { runner, tree } = setup(
      `export { injectQueries } from '@tanstack/angular-query-experimental/inject-queries-experimental';`,
    )
    const ignored = `import { injectQuery } from '@tanstack/angular-query-experimental';`
    tree.create('/node_modules/example/index.ts', ignored)
    tree.create('/dist/app.ts', ignored)
    tree.create('/.angular/cache/app.ts', ignored)
    tree.create('/.nx/cache/app.ts', ignored)
    tree.overwrite(
      '/package.json',
      JSON.stringify({
        dependencies: {
          [packageJson.name]: '~99.0.0',
          '@tanstack/angular-query-experimental': '^5',
        },
      }),
    )
    const result = await runner.runSchematic(
      'migrate-from-experimental',
      {},
      tree,
    )
    expect(result.readContent('/src/app.ts')).toContain(
      `from "${packageJson.name}"`,
    )
    expect(result.readContent('/node_modules/example/index.ts')).toBe(ignored)
    expect(result.readContent('/dist/app.ts')).toBe(ignored)
    expect(result.readContent('/.angular/cache/app.ts')).toBe(ignored)
    expect(result.readContent('/.nx/cache/app.ts')).toBe(ignored)
    expect(
      JSON.parse(result.readContent('/package.json')).dependencies[
        packageJson.name
      ],
    ).toBe('~99.0.0')
  })
})

// These exercise the published collection, including dependency edits and diagnostics.
describe('migration regression coverage', () => {
  it.each([
    ['devtools', ''],
    ['devtools/production', '/production'],
    ['devtools-panel', '/devtools-panel'],
    ['devtools-panel/production', '/devtools-panel/production'],
  ])(
    'moves the %s entrypoint and installs devtools',
    async (oldPath, newPath) => {
      const { runner, tree } =
        setup(`import * as tools from '@tanstack/angular-query-experimental/${oldPath}';
export * from '@tanstack/angular-query-experimental/${oldPath}';`)
      const result = await runner.runSchematic(
        'migrate-from-experimental',
        {},
        tree,
      )
      expect(result.readContent('/src/app.ts')).not.toContain(
        '@tanstack/angular-query-experimental',
      )
      expect(
        result
          .readContent('/src/app.ts')
          .match(new RegExp(`${devtoolsPackage.name}${newPath}`, 'g')),
      ).toHaveLength(2)
      expect(
        JSON.parse(result.readContent('/package.json')).dependencies[
          devtoolsPackage.name
        ],
      ).toBe(`^${devtoolsPackage.version}`)
      expect(runner.tasks).toHaveLength(1)
    },
  )

  it('reports unknown entrypoints instead of inventing an export', async () => {
    const { runner, tree, warnings } = setup(
      `import * as tools from '@tanstack/angular-query-experimental/devtools/panel';`,
    )
    const result = await runner.runSchematic(
      'migrate-from-experimental',
      {},
      tree,
    )
    expect(result.readContent('/src/app.ts')).toContain('/devtools/panel')
    expect(warnings.join('\n')).toContain(
      'Unrecognized experimental entrypoint',
    )
    expect(
      JSON.parse(result.readContent('/package.json')).dependencies[
        devtoolsPackage.name
      ],
    ).toBeUndefined()
  })

  it('renames provider references and reports indirect helper uses without touching shadowed namespaces', async () => {
    const { runner, tree, warnings } =
      setup(`import * as query from '@tanstack/angular-query-experimental';
import { provideAngularQuery as provide, injectIsFetching } from '@tanstack/angular-query-experimental';
const provider = query.provideAngularQuery;
const otherProvider = query.provideQueryClient;
const client = query.injectQueryClient;
const aliased = provide;
const count = injectIsFetching;
function unrelated(query: any) { return query.provideAngularQuery; }`)
    const result = await runner.runSchematic(
      'migrate-from-experimental',
      {},
      tree,
    )
    const output = result.readContent('/src/app.ts')
    expect(output).toContain('const provider = query.provideTanStackQuery')
    expect(output).toContain('const otherProvider = query.provideTanStackQuery')
    expect(output).toContain('const client = query.injectQueryClient')
    expect(output).toContain(
      'function unrelated(query: any) { return query.provideAngularQuery; }',
    )
    expect(
      warnings.filter((message) => message.includes('provider reference')),
    ).toHaveLength(3)
    expect(warnings.join('\n')).toContain(
      'Replace this indirect reference with a function that calls inject(QueryClient)',
    )
    expect(warnings.join('\n')).toContain('callback-based filters')
  })

  it.each([
    ['provideIsRestoring', 'withPersistQueryClient'],
    ['queryFeature', 'supported with* features'],
    ['QueryFeatures', 'non-generic QueryFeature'],
    ['DevtoolsFeature', 'non-generic QueryFeature'],
    ['PersistQueryClientFeature', 'non-generic QueryFeature'],
    ['CreateBaseQueryOptions', 'CreateQueryOptions'],
  ])(
    'reports removed %s imports, namespace references and re-exports',
    async (name, guidance) => {
      const { runner, tree, warnings } =
        setup(`import { ${name} as legacy } from '@tanstack/angular-query-experimental';
import * as query from '@tanstack/angular-query-experimental';
export { ${name} } from '@tanstack/angular-query-experimental';
type Used = typeof query.${name};`)
      await runner.runSchematic('migrate-from-experimental', {}, tree)
      const removed = warnings.filter((message) =>
        message.includes(`${name} was removed`),
      )
      expect(removed).toHaveLength(3)
      expect(removed.every((message) => message.includes(guidance))).toBe(true)
    },
  )

  it('reports generic QueryFeature references through aliases and namespaces', async () => {
    const { runner, tree, warnings } =
      setup(`import type { QueryFeature as Feature } from '@tanstack/angular-query-experimental';
import type * as query from '@tanstack/angular-query-experimental';
let named: Feature<'Devtools'>;
let namespace: query.QueryFeature<'PersistQueryClient'>;
let supported: Feature;`)
    await runner.runSchematic('migrate-from-experimental', {}, tree)
    expect(warnings).toHaveLength(2)
    expect(
      warnings.every((message) =>
        message.includes('QueryFeature is no longer generic'),
      ),
    ).toBe(true)
  })

  it('preserves type-only provider specifiers when renaming imports', async () => {
    const { runner, tree } =
      setup(`import { type provideAngularQuery } from '@tanstack/angular-query-experimental';
type Provider = typeof provideAngularQuery;`)
    const result = await runner.runSchematic(
      'migrate-from-experimental',
      {},
      tree,
    )
    expect(result.readContent('/src/app.ts')).toContain(
      'type provideTanStackQuery as provideAngularQuery',
    )
  })

  it('limits option diagnostics to observer options, client defaults and devtools injection dependencies', async () => {
    const { runner, tree, warnings } =
      setup(`import { injectQuery as query, mutationOptions, QueryClient } from '@tanstack/angular-query-experimental';
import { withDevtools as tools } from '@tanstack/angular-query-experimental/devtools';
query(() => ({ throwOnError: true, meta: { throwOnError: true } }));
mutationOptions({ throwOnError: true });
new QueryClient({ defaultOptions: { queries: { throwOnError: true }, mutations: { throwOnError: true } } });
tools(() => ({}), { deps: [Manager] });
result.refetch({ throwOnError: true });
result.fetchNextPage({ throwOnError: true });
const unrelated = { deps: [], throwOnError: true };
function shadowed(query: any, tools: any) { query(() => ({ throwOnError: true })); tools(() => ({}), { deps: [] }); }`)
    const result = await runner.runSchematic(
      'migrate-from-experimental',
      {},
      tree,
    )
    expect(
      warnings.filter((message) => message.includes('Observer throwOnError')),
    ).toHaveLength(4)
    expect(
      warnings.filter((message) =>
        message.includes('withDevtools no longer accepts deps'),
      ),
    ).toHaveLength(1)
    expect(warnings).toHaveLength(5)
    expect(result.readContent('/src/app.ts')).toContain(
      'result.refetch({ throwOnError: true })',
    )
    expect(result.readContent('/src/app.ts')).toContain(
      'const unrelated = { deps: [], throwOnError: true }',
    )
  })

  it('finds returned observer options without treating nested functions as option factories', async () => {
    const { runner, tree, warnings } =
      setup(`import { injectInfiniteQuery, injectMutation } from '@tanstack/angular-query-experimental';
injectInfiniteQuery(() => { const unrelated = () => ({ throwOnError: true }); return { throwOnError: true }; });
injectMutation(() => condition ? { throwOnError: true } : ({ throwOnError: true } as any));`)
    await runner.runSchematic('migrate-from-experimental', {}, tree)
    expect(warnings).toHaveLength(3)
    expect(
      warnings.every((message) => message.includes('Observer throwOnError')),
    ).toBe(true)
  })

  it('replaces peer and optional dependencies while preserving existing ranges and unrelated manifest formatting', async () => {
    const { runner, tree, warnings } = setup(
      `import { injectQuery } from '@tanstack/angular-query-experimental';`,
    )
    tree.overwrite(
      '/package.json',
      '{\r\n    "name": "library",\r\n    "peerDependencies": {\r\n        "@tanstack/angular-query-experimental": "^5",\r\n        "@tanstack/angular-query": "~99.0.0"\r\n    },\r\n    "optionalDependencies": { "@tanstack/angular-query-experimental": "^5" },\r\n    "peerDependenciesMeta": { "@tanstack/angular-query-experimental": { "optional": true } }\r\n}\r\n',
    )
    const result = await runner.runSchematic(
      'migrate-from-experimental',
      {},
      tree,
    )
    const text = result.readContent('/package.json')
    const pkg = JSON.parse(text)
    expect(text).toContain('    "name": "library",\r\n')
    expect(pkg.peerDependencies).toEqual({ [packageJson.name]: '~99.0.0' })
    expect(pkg.optionalDependencies).toEqual({
      [packageJson.name]: `^${packageJson.version}`,
    })
    expect(warnings.join('\n')).toContain('Rename peerDependenciesMeta')
    expect(runner.tasks).toHaveLength(1)
  })

  it('uses inherited build/test configurations, follows local imports, and updates library manifests', async () => {
    const legacy = `import { injectQuery } from '@tanstack/angular-query-experimental';`
    const { runner, tree } = setup(legacy)
    tree.create(
      '/angular.json',
      JSON.stringify({
        version: 1,
        projects: {
          app: {
            projectType: 'application',
            root: '',
            sourceRoot: 'src',
            architect: {
              build: {
                builder: '@angular/build:application',
                options: { tsConfig: 'tsconfig.app.json' },
                configurations: {
                  production: { tsConfig: 'tsconfig.production.json' },
                },
              },
              test: {
                builder: '@angular/build:unit-test',
                options: { tsConfig: 'tsconfig.spec.json' },
              },
            },
          },
          lib: {
            projectType: 'library',
            root: 'projects/lib',
            sourceRoot: 'projects/lib/src',
            architect: {
              build: {
                builder: '@angular/build:ng-packagr',
                options: { tsConfig: 'projects/lib/tsconfig.lib.json' },
              },
            },
          },
        },
      }),
    )
    tree.create(
      '/tsconfig.json',
      JSON.stringify({ compilerOptions: { moduleResolution: 'node' } }),
    )
    tree.create(
      '/tsconfig.app.json',
      JSON.stringify({
        extends: './tsconfig.json',
        files: ['src/main.ts'],
        include: [],
      }),
    )
    tree.create(
      '/tsconfig.spec.json',
      JSON.stringify({
        extends: './tsconfig.json',
        include: ['src/**/*.spec.ts'],
        exclude: ['src/ignored.spec.ts'],
      }),
    )
    tree.create(
      '/tsconfig.production.json',
      JSON.stringify({ files: ['production/app.ts'] }),
    )
    tree.create('/src/main.ts', `import './app'; import '../shared/query';`)
    tree.create('/shared/query.ts', legacy)
    tree.create('/src/app.spec.ts', legacy)
    tree.create('/src/ignored.spec.ts', legacy)
    tree.create('/src/orphan.ts', legacy)
    tree.create('/production/app.ts', legacy)
    tree.create(
      '/projects/lib/tsconfig.lib.json',
      JSON.stringify({
        extends: '../../tsconfig.json',
        include: ['src/**/*.ts'],
      }),
    )
    tree.create(
      '/projects/lib/src/lib.ts',
      `export { injectDevtoolsPanel } from '@tanstack/angular-query-experimental/devtools-panel';`,
    )
    tree.create(
      '/projects/lib/package.json',
      JSON.stringify({
        peerDependencies: { '@tanstack/angular-query-experimental': '^5' },
      }),
    )
    const result = await runner.runSchematic(
      'migrate-from-experimental',
      {},
      tree,
    )
    for (const path of [
      '/src/app.ts',
      '/shared/query.ts',
      '/src/app.spec.ts',
      '/production/app.ts',
    ])
      expect(result.readContent(path)).toContain(packageJson.name)
    expect(result.readContent('/src/ignored.spec.ts')).toBe(legacy)
    expect(result.readContent('/src/orphan.ts')).toBe(legacy)
    expect(result.readContent('/projects/lib/src/lib.ts')).toContain(
      `${devtoolsPackage.name}/devtools-panel`,
    )
    expect(
      JSON.parse(result.readContent('/projects/lib/package.json'))
        .peerDependencies,
    ).toEqual({
      [packageJson.name]: `^${packageJson.version}`,
      [devtoolsPackage.name]: `^${devtoolsPackage.version}`,
    })
    expect(
      JSON.parse(result.readContent('/package.json')).dependencies[
        devtoolsPackage.name
      ],
    ).toBeUndefined()
    expect(runner.tasks).toHaveLength(1)
    const again = await runner.runSchematic(
      'migrate-from-experimental',
      {},
      result,
    )
    expect(again.readContent('/projects/lib/src/lib.ts')).toBe(
      result.readContent('/projects/lib/src/lib.ts'),
    )
    expect(runner.tasks).toHaveLength(0)
  })

  it('summarizes prepared changes, links to the guide, and explains skipped installation', async () => {
    const { runner, tree, messages } = setup(
      `import { injectQuery } from '@tanstack/angular-query-experimental';`,
    )
    await runner.runSchematic(
      'migrate-from-experimental',
      { skipInstall: true },
      tree,
    )
    expect(messages.join('\n')).toContain(
      '1 source file(s) changed, 2 dependency change(s), 0 item(s) requiring manual review',
    )
    expect(messages.join('\n')).toContain(
      'Dependency installation was skipped. Run your package manager install command',
    )
    expect(messages.join('\n')).toContain(
      'run your application build, tests, linting, and formatting checks',
    )
    expect(messages.join('\n')).toContain(
      'https://tanstack.com/query/latest/docs/framework/angular/guides/migrating-from-experimental',
    )
    expect(runner.tasks).toHaveLength(0)
  })
  it('reports panel injector arguments and the removed panel options type', async () => {
    const { runner, tree, warnings } =
      setup(`import { injectDevtoolsPanel as panel, type InjectDevtoolsPanelOptions } from '@tanstack/angular-query-experimental/devtools-panel';
panel(() => ({}), { injector });`)
    await runner.runSchematic('migrate-from-experimental', {}, tree)
    expect(warnings).toHaveLength(2)
    expect(warnings.join('\n')).toContain(
      'InjectDevtoolsPanelOptions was removed',
    )
    expect(warnings.join('\n')).toContain('old options.injector')
  })
})

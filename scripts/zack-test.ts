import { execSync } from 'child_process'
import { join } from 'path'

const completedPackages = [
  'eslint-plugin-query',
  'query-async-storage-persister',
  'query-core',
  'query-persist-client-core',
  'query-sync-storage-persister',
  'react-query',
  //   'react-query-devtools',
  //   'react-query-persist-client',
  //   'solid-query',
  //   'svelte-query',
  //   'vue-query',
]

const cwd = join(__dirname, '..')
console.log(cwd)

for (const packageName of completedPackages) {
  console.log(`Starting package: ${packageName}`)
  execSync(`pnpm --filter=./packages/${packageName} run test:lib`, {
    cwd,
    stdio: 'inherit',
  })
  console.log(`"${packageName}" completed`)
}

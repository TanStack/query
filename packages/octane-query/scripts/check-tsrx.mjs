import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { compile } from 'octane/compiler'

const componentUrls = [
  new URL('../src/HydrationBoundary.tsrx', import.meta.url),
  new URL('../src/QueryClientProvider.tsrx', import.meta.url),
  new URL('../src/QueryErrorResetBoundary.tsrx', import.meta.url),
]

for (const componentUrl of componentUrls) {
  const filename = fileURLToPath(componentUrl)
  const source = await readFile(componentUrl, 'utf8')

  compile(source, filename, { mode: 'client' })
  compile(source, filename, { mode: 'server' })
}

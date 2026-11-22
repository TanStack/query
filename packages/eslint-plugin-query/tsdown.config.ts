import { defineConfig } from 'tsdown'
import { getTsdownConfig } from './root.tsdown.config.js'

export default defineConfig({
  ...getTsdownConfig({ entry: ['src/*.ts'] }),
  target: 'es2022',
  deps: { neverBundle: ['typescript'] },
})

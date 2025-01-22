import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import tsconfigPaths from 'vite-tsconfig-paths'

import { dynamicAliases } from './root.vite.config'

export default defineConfig({
  plugins: [solid(), tsconfigPaths({ ignoreConfigErrors: true })],
  resolve: {
    alias: dynamicAliases,
  },
})

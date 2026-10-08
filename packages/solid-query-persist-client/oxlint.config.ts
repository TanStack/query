import pluginSolid from 'eslint-plugin-solid/configs/typescript'
import { defineConfig } from 'oxlint'
import rootConfig from './root.oxlint.config.ts'

export default defineConfig({
  extends: [rootConfig],
  jsPlugins: ['eslint-plugin-solid'],
  rules: {
    ...pluginSolid.rules,
  },
})

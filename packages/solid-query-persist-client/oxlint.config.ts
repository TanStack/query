import pluginSolid from 'eslint-plugin-solid/configs/typescript'
import { defineConfig } from 'oxlint'
import rootConfig from './root.oxlint.config.ts'

export default defineConfig({
  extends: [rootConfig],
  settings: rootConfig.settings,
  jsPlugins: ['eslint-plugin-solid'],
  rules: {
    ...pluginSolid.rules,
  },
})

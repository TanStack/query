import { defineConfig } from 'oxlint'
import rootConfig, { vueConfig } from './root.oxlint.config.ts'

export default defineConfig({
  extends: [rootConfig, vueConfig],
  settings: rootConfig.settings,
})

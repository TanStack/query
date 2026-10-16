import { defineConfig } from 'oxlint'
import rootConfig from './root.oxlint.config.ts'

export default defineConfig({
  extends: [rootConfig],
  settings: rootConfig.settings,
})

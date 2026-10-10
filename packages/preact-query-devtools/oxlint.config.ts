import { defineConfig } from 'oxlint'
import rootConfig, { preactConfig } from './root.oxlint.config.ts'

export default defineConfig({
  extends: [rootConfig, preactConfig],
  settings: { ...rootConfig.settings, ...preactConfig.settings },
})

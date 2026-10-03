// @ts-check

import pluginVue from 'eslint-plugin-vue'
import { defineConfig } from 'eslint/config'
import rootConfig from './root.eslint.config.js'

export default defineConfig([...rootConfig, ...pluginVue.configs['flat/base']])

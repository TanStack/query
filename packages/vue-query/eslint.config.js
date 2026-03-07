// @ts-check

import pluginVue from 'eslint-plugin-vue'
import rootConfig from './root.eslint.config.js'

/** @type {import('eslint').Linter.Config[]} */
const config = [...rootConfig, ...pluginVue.configs['flat/base']]

export default config

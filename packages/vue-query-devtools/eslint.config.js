// @ts-check

// @ts-expect-error
import pluginVue from 'eslint-plugin-vue'
import rootConfig from '../../eslint.config.js'

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [...rootConfig, ...pluginVue.configs['flat/base']]

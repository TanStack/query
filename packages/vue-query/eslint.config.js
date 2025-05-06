// @ts-check

// @ts-expect-error
import pluginVue from 'eslint-plugin-vue'
import rootConfig from './root.eslint.config.js'

export default [...rootConfig, ...pluginVue.configs['flat/base']]

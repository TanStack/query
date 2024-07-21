// @ts-check

// @ts-expect-error
import pluginVue from 'eslint-plugin-vue'
import rootConfig from '../../eslint.config.js'

export default [...rootConfig, ...pluginVue.configs['flat/base']]

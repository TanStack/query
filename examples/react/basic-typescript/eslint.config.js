import pluginQuery from '@tanstack/eslint-plugin-query'
import rootConfig from '../../../eslint.config.js'

export default [...rootConfig, ...pluginQuery.configs['flat/recommended']]

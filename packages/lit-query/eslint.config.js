// @ts-check

import { configs as litConfigs } from 'eslint-plugin-lit'
import rootConfig from '../../eslint.config.js'

export default [
  ...rootConfig,
  {
    files: ['*.ts'],
    ...litConfigs['flat/recommended'],
  },
]

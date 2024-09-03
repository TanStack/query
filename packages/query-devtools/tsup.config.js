// @ts-check

import { defineConfig } from 'tsup'
import { generateTsupOptions, parsePresetOptions } from 'tsup-preset-solid'

const preset_options = {
  entries: {
    entry: 'src/index.ts',
    dev_entry: true,
  },
  cjs: true,
  drop_console: true,
}

export default defineConfig(() => {
  const parsed_data = parsePresetOptions(preset_options)
  const tsup_options = generateTsupOptions(parsed_data)

  tsup_options.forEach((tsup_option) => {
    tsup_option.outDir = 'build'
  })

  return tsup_options
})

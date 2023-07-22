// @ts-check

import { defineConfig } from 'tsup'
import * as preset from 'tsup-preset-solid'

const preset_options = {
  // array or single object
  entries: [
    // default entry (index)
    {
      // entries with '.tsx' extension will have `solid` export condition generated
      entry: 'src/index.tsx',
      // will generate a separate development entry
      dev_entry: true,
    },
  ],
  // Set to `true` to remove all `console.*` calls and `debugger` statements in prod builds
  drop_console: true,
  // Set to `true` to generate a CommonJS build alongside ESM
  cjs: true,
}

export default defineConfig(() => {
  const parsed_options = preset.parsePresetOptions(preset_options)
  const tsup_options = preset.generateTsupOptions(parsed_options)

  tsup_options.forEach((tsup_option) => {
    tsup_option.outDir = 'build'
  })

  return tsup_options
})

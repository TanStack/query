// @ts-nocheck - Config file uses untyped babel/esbuild imports for the custom Solid v2 build plugin
import { parse } from 'path'
import { readFile } from 'fs/promises'
import { transformAsync } from '@babel/core'
import solid from '@solidjs/babel-plugin'
import ts from '@babel/preset-typescript'
import { defineConfig } from 'tsup'
import { generateTsupOptions, parsePresetOptions } from 'tsup-preset-solid'

import type { Plugin } from 'esbuild'

// Custom esbuild plugin that compiles JSX with @solidjs/babel-plugin — the
// Solid 2.0 compiler, whose output targets the same @solidjs/web runtime the
// package declares as a peer (tsup-preset-solid's own plugin is Solid 1.x).
function solidV2Plugin(options: { generate: 'dom' | 'ssr' }): Plugin {
  return {
    name: 'esbuild:solid-v2',
    setup(build) {
      build.onLoad({ filter: /\.(t|j)sx$/ }, async (args) => {
        const source = await readFile(args.path, { encoding: 'utf-8' })
        const { name, ext } = parse(args.path)
        const filename = name + ext
        const result = await transformAsync(source, {
          presets: [[ts, {}]],
          plugins: [[solid, { generate: options.generate }]],
          filename,
          sourceMaps: 'inline',
        })
        if (result?.code === undefined || result.code === null) {
          throw new Error('No result was provided from Babel')
        }
        return { contents: result.code, loader: 'js' }
      })
    },
  }
}

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
    tsup_option.experimentalDts = true
    delete tsup_option.dts

    // Replace the default solid esbuild plugin (Solid 1.x's babel-preset-solid)
    // with the Solid 2.0 compiler.
    if (tsup_option.esbuildPlugins) {
      const nonSolidPlugins = tsup_option.esbuildPlugins.filter(
        (p) => !p.name.includes('solid'),
      )
      const hasSolidPlugin =
        nonSolidPlugins.length < tsup_option.esbuildPlugins.length
      if (hasSolidPlugin) {
        tsup_option.esbuildPlugins = [
          solidV2Plugin({ generate: 'dom' }),
          ...nonSolidPlugins,
        ]
      }
    }
  })

  return tsup_options
})

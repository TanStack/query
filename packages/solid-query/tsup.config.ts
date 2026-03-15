// @ts-nocheck - Config file uses untyped babel/esbuild imports for the custom Solid v2 build plugin
import { parse } from 'path'
import { readFile } from 'fs/promises'
import { transformAsync } from '@babel/core'
import solid from 'babel-preset-solid'
import ts from '@babel/preset-typescript'
import { defineConfig } from 'tsup'
import { generateTsupOptions, parsePresetOptions } from 'tsup-preset-solid'

import type { Plugin } from 'esbuild'

// Custom esbuild plugin that uses the locally-installed babel-preset-solid v2,
// which correctly emits '@solidjs/web' imports instead of 'solid-js/web'.
function solidV2Plugin(options: { generate: 'dom' | 'ssr' }): Plugin {
  return {
    name: 'esbuild:solid-v2',
    setup(build) {
      build.onLoad({ filter: /\.(t|j)sx$/ }, async (args) => {
        const source = await readFile(args.path, { encoding: 'utf-8' })
        const { name, ext } = parse(args.path)
        const filename = name + ext
        const result = await transformAsync(source, {
          presets: [
            [solid, { generate: options.generate }],
            [ts, {}],
          ],
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

    // Externalize @solidjs/web so that `isServer` is resolved at runtime by
    // the consuming bundler or Node.js rather than being inlined as `false`
    // from the browser build during our tsup compilation.
    tsup_option.external = [
      ...(Array.isArray(tsup_option.external) ? tsup_option.external : []),
      '@solidjs/web',
    ]

    // Replace the default solid esbuild plugin (which uses babel-preset-solid v1)
    // with our custom one that uses babel-preset-solid v2 for Solid v2 compatibility.
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

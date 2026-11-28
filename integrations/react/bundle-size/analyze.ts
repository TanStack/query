import path from 'node:path'
import { visualizer } from 'rollup-plugin-visualizer'

export function adapterTreemap(screen: string, adapter: string) {
  return visualizer({
    filename: path.join(
      import.meta.dirname,
      'dist/analyzer',
      screen,
      adapter + '.html',
    ),
    title: `${adapter} · ${screen}`,
    template: 'treemap',
    sourcemap: true,
    // Make source names comparable across the PR base and head checkouts.
    projectRoot: /^.*\/(?=(?:packages|integrations)\/)/,
  })
}

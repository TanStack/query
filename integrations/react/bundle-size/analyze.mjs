import path from 'node:path'
import { visualizer } from 'rollup-plugin-visualizer'

export function adapterTreemap(screen, packageName) {
  const name = packageName.split('/')[1]
  return visualizer({
    filename: path.join(
      import.meta.dirname,
      'dist/analyzer',
      screen,
      name + '.html',
    ),
    title: `${packageName} · ${screen}`,
    template: 'treemap',
    sourcemap: true,
    // Make source names comparable across the PR base and head checkouts.
    projectRoot: /^.*\/(?=(?:packages|integrations)\/)/,
  })
}

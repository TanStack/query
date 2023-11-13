// These aren't actual compilers, but performant & avoids root dependencies
const svelteCompiler = (text: string) => text.matchAll(/import[^;]+/g)
const vueCompiler = /<script\b[^>]*>([\s\S]*?)<\/script>/gm

export default {
  $schema: 'https://unpkg.com/knip@2/schema.json',
  ignoreWorkspaces: ['examples/**'],
  workspaces: {
    'packages/codemods': {
      entry: ['src/v4/*.js', 'src/v5/*/*.js'],
      ignore: ['**/__testfixtures__/**'],
    },
    'packages/vue-query': {
      ignore: ['**/__mocks__/**'],
    },
  },
  compilers: {
    svelte: (text: string) => [...svelteCompiler(text)].join('\n'),
    vue: (text) => {
      const scripts = []
      let match
      while ((match = vueCompiler.exec(text))) scripts.push(match[1])
      return scripts.join(';')
    },
  },
}

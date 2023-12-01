// These aren't actual compilers, but performant & avoids root dependencies
const svelteCompiler = (text: string) => text.matchAll(/import[^]*?'.*?'\n/gs)
const vueCompiler = /<script\b[^>]*>([\s\S]*?)<\/script>/gm

export default {
  $schema: 'https://unpkg.com/knip@2/schema.json',
  ignoreWorkspaces: ['examples/**'],
  ignore: ['**/react-app-env.d.ts', '**/vite-env.d.ts'],
  workspaces: {
    'packages/codemods': {
      entry: ['src/v4/*.js', 'src/v5/*/*.js'],
      ignore: ['**/__testfixtures__/**'],
    },
    'packages/vue-query': {
      ignore: ['**/__mocks__/**'],
      ignoreDependencies: ['vue2', 'vue2.7'],
    },
    'integrations/angular-cli-standalone-17': {
      entry: ['src/main.ts'],
    },
  },
  compilers: {
    svelte: (text: string) => [...svelteCompiler(text)].join('\n'),
    vue: (text: string) => {
      const scripts = []
      let match
      while ((match = vueCompiler.exec(text))) scripts.push(match[1])
      return scripts.join(';')
    },
  },
}

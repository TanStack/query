export default {
  displayName: 'svelte-query',
  preset: '../../jest-preset.js',
  transform: { '^.+\\.svelte$': ['svelte-jester', { 'preprocess': true }] }
}

// @ts-check

/** @type {import('prettier').Config} */
const config = {
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "plugins": ["prettier-plugin-svelte"],
  "overrides": [{ "files": "*.svelte", "options": { "parser": "svelte" } }]
}

export default config;

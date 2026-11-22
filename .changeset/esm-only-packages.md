---
'@tanstack/eslint-plugin-query': major
'@tanstack/lit-query': major
'@tanstack/preact-query': major
'@tanstack/preact-query-devtools': major
'@tanstack/preact-query-persist-client': major
'@tanstack/query-async-storage-persister': major
'@tanstack/query-broadcast-client-experimental': major
'@tanstack/query-core': major
'@tanstack/query-devtools': major
'@tanstack/query-persist-client-core': major
'@tanstack/react-query': major
'@tanstack/react-query-devtools': major
'@tanstack/react-query-next-experimental': major
'@tanstack/react-query-persist-client': major
'@tanstack/solid-query': major
'@tanstack/solid-query-devtools': major
'@tanstack/solid-query-persist-client': major
'@tanstack/vue-query': major
---

Publish ESM builds only and remove the legacy builds. Use `import` to load TanStack Query. If your application uses webpack 4, upgrade to webpack 5 or another bundler that supports the modern build. If you use the ESLint plugin with `.eslintrc`, migrate to flat config.

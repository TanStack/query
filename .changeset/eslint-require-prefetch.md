---
'@tanstack/eslint-plugin-query-prefetch': minor
---

feat(eslint-plugin-query-prefetch): add `@tanstack/eslint-plugin-query-prefetch` with the `require-prefetch` rule, which reports queries used when a route renders that the route doesn't prefetch before rendering, for TanStack Router, React Router, the Next.js App Router, and Waku. Imported files are parsed with the optional peer dependency `oxc-parser` when it is installed, which is faster and lets the rule follow imports when it runs as an Oxlint JS plugin

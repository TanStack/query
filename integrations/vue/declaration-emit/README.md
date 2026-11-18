# TanStack Vue Query Declaration Emit Integration

Checks that declarations emitted for `queryOptions` from `@tanstack/vue-query` are portable and type-check in a consumer.

## What it checks

- `src/query-options.ts` exports two `queryOptions` results, one without `initialData` and one with it.
- `tsconfig.emit.json` emits declarations only from `src/` to `dist/`.
- `tsconfig.consume.json` type-checks `consumer/query-options.ts`, which imports both options from `../dist/query-options.js`, with `skipLibCheck: false`.
- Both steps run with TypeScript 6, TypeScript 7.0, and TypeScript 7.1 (dev build) from the root `node_modules`.
- CI runs the `test:types` script, which runs `test:types:ts6`, `test:types:ts7`, and `test:types:ts71`.

To run it from the repository root:

- `pnpm nx run @tanstack/query-integration-vue-declaration-emit:test:types`

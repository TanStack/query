# TanStack React Query NodeNext Integration

Checks that `@tanstack/react-query` resolves and emits declarations under `moduleResolution: "nodenext"` from ESM files.

## What it checks

- `src/hooks.ts` (ESM, since `package.json` sets `"type": "module"`) exports a hook that calls `useQuery`.
- `tsconfig.json` sets `module` and `moduleResolution` to `nodenext` with `declaration` and `emitDeclarationOnly`, so TypeScript writes declarations to `dist/`.
- `src/sharedTypes.ts` augments the shared `Register` and passes an adapter-tagged query key to all three clients to check inference across the published ESM entry points.
- The check runs with TypeScript 6, TypeScript 7.0, and TypeScript 7.1 (dev build) from the root `node_modules`.
- CI runs the `test:types` script, which runs `test:types:ts6`, `test:types:ts7`, and `test:types:ts71`.

To run it from the repository root:

- `pnpm nx run @tanstack/query-integration-react-nodenext:test:types`

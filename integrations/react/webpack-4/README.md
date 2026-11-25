# TanStack React Query Webpack 4 Integration

Checks that `@tanstack/react-query` and `@tanstack/react-query-devtools` build and type-check with webpack 4.

## What it checks

- `src/index.tsx` renders the app inside `React.StrictMode` and `QueryClientProvider` together with `ReactQueryDevtools`, and `src/App.tsx` reads a query with `useQuery`.
- `webpack.config.js` compiles `src/index.tsx` with `babel-loader` 8 and the `@babel/preset-env`, `@babel/preset-react`, and `@babel/preset-typescript` presets, and generates `index.html` with `html-webpack-plugin` 4.
- The `build` script sets `NODE_OPTIONS=--openssl-legacy-provider` for webpack 4.
- `tsconfig.json` sets `moduleResolution: "Node10"` with `ignoreDeprecations: "6.0"`.
- CI runs the `build` (`webpack --mode production`) and `test:types` (`tsc --noEmit`) scripts.

To run it from the repository root:

- `pnpm nx run @tanstack/query-integration-react-webpack-4:build`
- `pnpm nx run @tanstack/query-integration-react-webpack-4:test:types`

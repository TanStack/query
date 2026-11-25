# TanStack React Query Webpack 5 Integration

Checks that `@tanstack/react-query` and `@tanstack/react-query-devtools` build and type-check with webpack 5.

## What it checks

- `src/index.tsx` renders the app inside `React.StrictMode` and `QueryClientProvider` together with `ReactQueryDevtools`, and `src/App.tsx` reads a query with `useQuery`.
- `webpack.config.js` compiles `src/index.tsx` with `babel-loader` 9 and the `@babel/preset-env`, `@babel/preset-react`, and `@babel/preset-typescript` presets, and generates `index.html` with `html-webpack-plugin` 5.
- `tsconfig.json` sets `moduleResolution: "Bundler"`.
- CI runs the `build` (`webpack --mode production`) and `test:types` (`tsc --noEmit`) scripts.

To run it from the repository root:

- `pnpm nx run @tanstack/query-integration-react-webpack-5:build`
- `pnpm nx run @tanstack/query-integration-react-webpack-5:test:types`

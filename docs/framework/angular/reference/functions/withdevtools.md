---
id: withDevtools
title: withDevtools
---

# Function: withDevtools()

```ts
function withDevtools(optionsFn?): DeveloperToolsFeature
```

Enables developer tools.

**Example**

```ts
export const appConfig: ApplicationConfig = {
  providers: [provideTanStackQuery(new QueryClient(), withDevtools())],
}
```

By default the devtools will be loaded when Angular runs in development mode and rendered in `<body>`.

If you need more control over when devtools are loaded, you can use the `loadDevtools` option. This is particularly useful if you want to load devtools based on environment configurations. For instance, you might have a test environment running in production mode but still require devtools to be available.

If you need more control over where devtools are rendered, consider `injectDevtoolsPanel`. This allows rendering devtools inside your own devtools for example.

## Parameters

### optionsFn?

() => [`DevtoolsOptions`](../interfaces/devtoolsoptions.md)

A function that returns `DevtoolsOptions`.

## Returns

[`DeveloperToolsFeature`](../type-aliases/developertoolsfeature.md)

A set of providers for use with `provideTanStackQuery`.

## See

- [provideTanStackQuery](providetanstackquery.md)
- [DevtoolsOptions](../interfaces/devtoolsoptions.md)

## Defined in

[providers.ts:244](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/providers.ts#L244)

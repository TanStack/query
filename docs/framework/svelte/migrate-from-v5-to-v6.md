## Overview

While Svelte v5 has legacy compatibility with the stores syntax from Svelte v3/v4, it has been somewhat buggy and unreliable for this adapter. The `@tanstack/svelte-query` v6 adapter fully migrates to the runes syntax, which relies on signals. This rewrite should also simplify the code required to ensure your query inputs remain reactive.

## Installation

Please ensure your project has [Svelte v5.25.0](https://github.com/sveltejs/svelte/releases/tag/svelte%405.25.0) or newer.

Run `pnpm add @tanstack/svelte-query@latest` (or your package manager's equivalent).

> Note that `@tanstack/svelte-query` v6 depends on `@tanstack/query-core` v5.

## Thunks

Like the Solid adapter, most functions for the Svelte adapter now require options to be provided as a "thunk" (`() => options`) to provide reactivity.

```diff
-const query = createQuery({
+const query = createQuery(() => ({
  queryKey: ['todos'],
  queryFn: () => fetchTodos(),
-})
+}))
```

## Accessing Properties

Given the adapter no longer uses stores, it is no longer necessary to prefix with `$`.

```diff
-{#if $todos.isSuccess}
+{#if todos.isSuccess}
  <ul>
-    {#each $todos.data.items as item}
+    {#each todos.data.items as item}
      <li>{item}</li>
    {/each}
  </ul>
{/if}
```

## Reactivity

You previously needed to do some funky things with stores to achieve reactivity for inputs. This is no longer the case! You don't even need to wrap your query in a `$derived`.

```diff
-const intervalMs = writable(1000)
+let intervalMs = $state(1000)

-const query = createQuery(derived(intervalMs, ($intervalMs) => ({
+const query = createQuery(() => ({
  queryKey: ['refetch'],
  queryFn: async () => await fetch('/api/data').then((r) => r.json()),
  refetchInterval: $intervalMs,
-})))
+}))
```

## Disabling Legacy Mode

If your component has any stores, it might not properly switch to runes mode. You can ensure your application is using runes in two ways:

### On a per-file basis

In each `.svelte` file, once you have migrated to runes, add `<svelte:options runes={true} />`. This is better for large applications requiring gradual migration.

### On an project-wide basis

In your `svelte.config.js`, add the following to config:

```json
  compilerOptions: {
    runes: true,
  },
```

This can be added once you've 100% eradicated stores syntax from your app.

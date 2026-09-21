---
id: useIsRestoring
title: useIsRestoring
---

```ts
function useIsRestoring(): Box<boolean>;
```

Defined in: [packages/svelte-query/src/useIsRestoring.ts:24](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/useIsRestoring.ts#L24)

If you are using `PersistQueryClientProvider`, you can also use the `useIsRestoring` function alongside it to
check if a restore is currently in progress. `createQuery` and friends also check this internally to avoid
race conditions between the restore and mounting queries.

## Returns

`Box`\<`boolean`\>

A reactive box — read `.current` for `true` while a persisted client is being restored, `false`
otherwise.

## Example

```svelte
<script lang="ts">
  import { useIsRestoring } from '@tanstack/svelte-query'

  const isRestoring = useIsRestoring()
</script>

{#if isRestoring.current}
  <div>Restoring cached data...</div>
{/if}
```

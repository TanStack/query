---
id: HydrationBoundary
title: HydrationBoundary
---

```ts
function HydrationBoundary(props: HydrationBoundaryProps): ReactElement<unknown, string | JSXElementConstructor<any>>;
```

Defined in: [packages/react-query/src/HydrationBoundary.tsx:85](https://github.com/TanStack/query/blob/main/packages/react-query/src/HydrationBoundary.tsx#L85)

`HydrationBoundary` adds a previously dehydrated state into the `queryClient` that would be returned by
`useQueryClient()`. If the client already contains data, the new queries will be intelligently merged based on
update timestamp.

Note: Only `queries` can be dehydrated with an `HydrationBoundary`.

## Parameters

### props

[`HydrationBoundaryProps`](../interfaces/HydrationBoundaryProps.md)

The dehydrated `state` to hydrate, the hydrate `options`, an optional custom
`queryClient`, and the `children` to render.

<a id="props-properties"></a>

#### `props` properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="props-property-children"></a> `children?` | `ReactNode` | The components to render — always rendered unconditionally, not gated on hydration. New queries are hydrated into the cache during render; for queries that already exist in the cache, only newer dehydrated data is hydrated, and that happens in an effect after commit, so `children` may render briefly before it lands. |
| <a id="props-property-options"></a> `options?` | [`OmitKeyof`](../type-aliases/OmitKeyof.md)\<[`HydrateOptions`](../interfaces/HydrateOptions.md), `"defaultOptions"`\> & `object` | Optional. Note: unlike `hydrate`, `mutations` cannot be set here. |
| <a id="props-property-queryclient"></a> `queryClient?` | [`QueryClient`](../classes/QueryClient.md) | Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will be used. |
| <a id="props-property-state"></a> `state` | [`DehydratedState`](../interfaces/DehydratedState.md) \| `null` \| `undefined` | The state to hydrate. |

## Returns

`ReactElement`\<`unknown`, `string` \| `JSXElementConstructor`\<`any`\>\>

The provided `children`, rendered unconditionally. New queries in `state` are hydrated into the
cache during render; for queries already in the cache, only newer dehydrated data is hydrated, in an effect
after commit.

## Examples

```tsx
import { HydrationBoundary } from '@tanstack/react-query'

function App() {
  return <HydrationBoundary state={dehydratedState}>...</HydrationBoundary>
}
```

Server-side prefetch handed off to the client via `dehydrate`:
```tsx
import { HydrationBoundary, dehydrate, noop } from '@tanstack/react-query'

async function ServerComponent() {
  const queryClient = getQueryClient()

  await queryClient
    .query({
      queryKey: ['posts'],
      queryFn: fetchPosts,
    })
    .catch(noop)

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Posts />
    </HydrationBoundary>
  )
}
```

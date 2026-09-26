---
id: HydrationBoundaryProps
title: HydrationBoundaryProps
---

Defined in: [packages/react-query/src/HydrationBoundary.tsx:16](https://github.com/TanStack/query/blob/main/packages/react-query/src/HydrationBoundary.tsx#L16)

The props accepted by `HydrationBoundary`.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="children"></a> `children?` | `ReactNode` | The components to render — always rendered unconditionally, not gated on hydration. New queries are hydrated into the cache during render; for queries that already exist in the cache, only newer dehydrated data is hydrated, and that happens in an effect after commit, so `children` may render briefly before it lands. |
| <a id="options"></a> `options?` | [`OmitKeyof`](../type-aliases/OmitKeyof.md)\<[`HydrateOptions`](HydrateOptions.md), `"defaultOptions"`\> & `object` | Optional. Note: unlike `hydrate`, `mutations` cannot be set here. |
| <a id="queryclient"></a> `queryClient?` | [`QueryClient`](../classes/QueryClient.md) | Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will be used. |
| <a id="state"></a> `state` | [`DehydratedState`](DehydratedState.md) \| `null` \| `undefined` | The state to hydrate. |

---
id: environmentManager
title: environmentManager
redirect_from:
  - reference/environmentManager
---

```ts
const environmentManager: object;
```

Defined in: [packages/query-core/src/environmentManager.ts:29](https://github.com/TanStack/query/blob/main/packages/query-core/src/environmentManager.ts#L29)

Manages how TanStack Query detects whether the current runtime should be treated as
server-side, which disables scheduling refetch timers and changes the default `retry` count
and `gcTime`. By default, the detection treats a missing `window` (or the presence of a
`Deno` global) as server.

Override this for runtimes where that default detection would give the wrong answer — for
example, a Service Worker, where `window` is undefined even though the environment should
behave like a client.

## Type Declaration

### isServer()

```ts
isServer: () => boolean;
```

Returns whether the current runtime should be treated as a server environment.

#### Returns

`boolean`

### setIsServer()

```ts
setIsServer(isServerValue): void;
```

Overrides the server check globally.

#### Parameters

##### isServerValue

`IsServerValue`

#### Returns

`void`

## Example

```ts
import { environmentManager } from '@tanstack/query-core'

environmentManager.setIsServer(() => false)
```

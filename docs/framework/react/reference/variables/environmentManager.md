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
server-side. By default, this uses the same detection as the exported `isServer` utility.

Override this for runtimes that are not traditional browser/server environments (e.g.
extension workers), where the default detection would give the wrong answer.

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
import { environmentManager, isServer } from '@tanstack/query-core'

environmentManager.setIsServer(() => typeof window === 'undefined' && !('chrome' in globalThis))

// Restore the default behavior:
environmentManager.setIsServer(() => isServer)
```

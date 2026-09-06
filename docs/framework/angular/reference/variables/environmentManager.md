---
id: environmentManager
title: environmentManager
---

```ts
const environmentManager: object;
```

Defined in: packages/query-core/dist-ts/src/environmentManager.d.ts:9

Manages environment detection used by TanStack Query internals.

## Type Declaration

### isServer

```ts
isServer: typeof isServer;
```

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

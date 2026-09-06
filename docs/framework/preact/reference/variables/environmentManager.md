---
id: environmentManager
title: environmentManager
---

```ts
const environmentManager: object;
```

Defined in: [packages/query-core/src/environmentManager.ts:15](https://github.com/TanStack/query/blob/main/packages/query-core/src/environmentManager.ts#L15)

Manages environment detection used by TanStack Query internals.

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

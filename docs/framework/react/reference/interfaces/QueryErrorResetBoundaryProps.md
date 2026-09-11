---
id: QueryErrorResetBoundaryProps
title: QueryErrorResetBoundaryProps
---

Defined in: [packages/react-query/src/QueryErrorResetBoundary.tsx:94](https://github.com/TanStack/query/blob/main/packages/react-query/src/QueryErrorResetBoundary.tsx#L94)

The props accepted by `QueryErrorResetBoundary`.

## Properties

### children

```ts
children: 
  | ReactNode
  | QueryErrorResetBoundaryFunction;
```

Defined in: [packages/react-query/src/QueryErrorResetBoundary.tsx:99](https://github.com/TanStack/query/blob/main/packages/react-query/src/QueryErrorResetBoundary.tsx#L99)

Either a plain node, or a function that receives the boundary's QueryErrorResetBoundaryValue and
returns a node.

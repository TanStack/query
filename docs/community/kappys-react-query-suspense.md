---
id: kappys-react-query-suspense
title: React Query Suspense
---

Suspense your components until wherever call is completed just passing the query key.

It's powerful because it isn't necessary pass isLoading props child by child or use the isLoading Hook. This does it by you

## Installation
You can install React Query Suspense via [NPM](https://www.npmjs.com/package/@kappys/react-query-suspense).

```bash
$ npm i @kappys/react-query-suspense
# or
$ pnpm add @kappys/react-query-suspense
# or
$ yarn add @kappys/react-query-suspense
```

## ⚡ Quick start

Start wrapping the content that you want suspense until the call is ready to render.


#### Simple way wrapping a component with `ReactQuerySuspense` waiting the example query key call.

It's not necessary check isLoading or isSuccess, just pass by props the queryKey and forget all things.

```ts
import React from "react";
import { ReactQuerySuspense, QueryKey } from '@kappys/react-query-suspense'

export const SampleComponent: React.FC<React.PropsWithChildren<{
  keys: QueryKey[];
}>> = ({ children, keys }) => {

  const key: QueryKey = ["example"];

  return (
    <ReactQuerySuspense Fallback={<>loading</>} queryKeys={keys}>
      <div>{children}</div>
    </ReactQuerySuspense>
  );
};
```


#### Example with `ReactQuerySuspense` in real world waiting multiples calls


[![Edit react-query-suspense](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/react-query-suspense-qrjvtm?fontsize=14&hidenavigation=1&theme=dark&view=editor)


## 📝 Features

`Important: On Error fetch, this library will keep loading, in a future we will implement FallbackError`

#### Suspense

```ts
<ReactQuerySuspense Fallback={<>loading</>} queryKeys={['query', 'key']}>
  <div>Test</div>
</ReactQuerySuspense>
```

#### Suspense with deferred fetch option
- it will force to put the loading in the first rendering.
```ts
<ReactQuerySuspense Fallback={<>loading</>} queryKeys={['query', 'key']} deferredFetch>
  <div>Test</div>
</ReactQuerySuspense>
```

#### Suspense waiting multiples calls
```ts
const keys1 = ['query', 'key1'];
const keys2 = ['query', 'key2'];

<ReactQuerySuspense Fallback={<>loading</>} queryKeys={[[keys1], [keys2]]}>
  <div>Test</div>
</ReactQuerySuspense>
```


Check the complete documentation on [GitHub](https://github.com/kappys1/react-query-suspense).

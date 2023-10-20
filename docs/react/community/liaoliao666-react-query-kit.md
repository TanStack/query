---
id: liaoliao666-react-query-kit
title: React Query Kit
---

🕊️ A toolkit for ReactQuery that makes ReactQuery hooks reusable and typesafe

## what do you benefit from it

- Make `queryKey` strongly related with `queryFn`
- Manage `queryKey` in a type-safe way
- Generate a custom ReactQuery hook quickly
- Make `queryClient`'s operations clearly associated with custom ReactQuery hooks
- Middleware

## Installation

This module is distributed via [NPM](https://www.npmjs.com/package/react-query-kit) and
should be installed as one of your project's `dependencies`:

```bash
$ npm i react-query-kit
# or
$ pnpm add react-query-kit
# or
$ yarn add react-query-kit
```

## Quick start with nextjs

[CodeSandbox](https://codesandbox.io/s/example-react-query-kit-nextjs-uldl88)

```tsx
import { QueryClient, dehydrate } from '@tanstack/react-query'
import { createQuery } from 'react-query-kit'

type Response = { title: string; content: string }
type Variables = { id: number }

const usePost = createQuery<Response, Variables, Error>({
  primaryKey: '/posts',
  queryFn: ({ queryKey: [primaryKey, variables] }) => {
    // primaryKey equals to '/posts'
    return fetch(`${primaryKey}/${variables.id}`).then((res) => res.json())
  },
})

const variables = { id: 1 }

export default function Page() {
  // queryKey equals to ['/posts', { id: 1 }]
  const { data } = usePost({ variables })

  return (
    <div>
      <div>{data?.title}</div>
      <div>{data?.content}</div>
    </div>
  )
}

console.log(usePost.getKey()) //  ['/posts']
console.log(usePost.getKey(variables)) //  ['/posts', { id: 1 }]
console.log(queryClient.getQueryData(usePost.getKey(variables))) // Response | undefined

export async function getStaticProps() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery(usePost.getFetchOptions(variables))

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  }
}
```

## Middleware

You can also execute logic before and after hooks via middleware. [See details](https://github.com/liaoliao666/react-query-kit#middleware)

```ts
import { createQuery, Middleware } from 'react-query-kit'

const disabledIfHasData: Middleware<QueryHook<Response, Variables>> = (
  useQueryNext,
) => {
  return (options) => {
    const client = useQueryClient()
    const hasData = () =>
      !!client.getQueryData(useUser.getKey(options.variables))

    return useQueryNext({
      ...options,
      enabled: options.enabled ?? !hasData(),
    })
  }
}

createQuery<Response, Variables>({
  // ...
  use: [disabledIfHasData],
})
```

Check the complete documentation on [GitHub](https://github.com/liaoliao666/react-query-kit).

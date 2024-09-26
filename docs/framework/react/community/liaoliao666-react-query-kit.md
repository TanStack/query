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
- Set defaultOptions for custom ReactQuery hooks easier and clearer

## Installation

This module is distributed via [NPM](https://www.npmjs.com/package/react-query-kit) and
should be installed as one of your project's `dependencies`:

```bash
npm i react-query-kit
```

or

```bash
pnpm add react-query-kit
```

or

```bash
yarn add react-query-kit
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
    return fetch(`${primaryKey}/${variables.id}`).then(res => res.json())
  },
  suspense: true
})

const variables = { id: 1 }

export default function Page() {
  // queryKey equals to ['/posts', { id: 1 }]
  const { data } = usePost({ variables, suspense: true })

  return (
    <div>
      <div>{data?.title}</div>
      <div>{data?.content}</div>
    </div>
  )
}

console.log(usePost.getKey()) //  ['/posts']
console.log(usePost.getKey(variables)) //  ['/posts', { id: 1 }]

export async function getStaticProps() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery(usePost.getKey(variables), usePost.queryFn)

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  }
}
```

Check the complete documentation on [GitHub](https://github.com/liaoliao666/react-query-kit).

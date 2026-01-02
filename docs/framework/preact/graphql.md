---
id: graphql
title: GraphQL
---

Because Preact Query's fetching mechanisms are agnostically built on Promises, you can use Preact Query with literally any asynchronous data fetching client, including GraphQL!

> Keep in mind that Preact Query does not support normalized caching. While a vast majority of users do not actually need a normalized cache or even benefit from it as much as they believe they do, there may be very rare circumstances that may warrant it so be sure to check with us first to make sure it's truly something you need!

[//]: # 'Codegen'

## Type-Safety and Code Generation

Preact Query, used in combination with `graphql-request^5` and [GraphQL Code Generator](https://graphql-code-generator.com/) provides full-typed GraphQL operations:

```tsx
import request from 'graphql-request'
import { useQuery } from '@tanstack/preact-query'

import { graphql } from './gql/gql'

const allFilmsWithVariablesQueryDocument = graphql(/* GraphQL */ `
  query allFilmsWithVariablesQuery($first: Int!) {
    allFilms(first: $first) {
      edges {
        node {
          id
          title
        }
      }
    }
  }
`)

function App() {
  // `data` is fully typed!
  const { data } = useQuery({
    queryKey: ['films'],
    queryFn: async () =>
      request(
        'https://swapi-graphql.netlify.app/.netlify/functions/index',
        allFilmsWithVariablesQueryDocument,
        // variables are type-checked too!
        { first: 10 },
      ),
  })
  // ...
}
```

_You can find a [complete example in the repo](https://github.com/dotansimha/graphql-code-generator/tree/7c25c4eeb77f88677fd79da557b7b5326e3f3950/examples/front-end/react/tanstack-react-query)_

Get started with the [dedicated guide on GraphQL Code Generator documentation](https://www.the-guild.dev/graphql/codegen/docs/guides/react-vue).

[//]: # 'Codegen'

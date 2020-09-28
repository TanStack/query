---
id: graphql
title: GraphQL
---

Because React Query's fetching mechanisms are agnostically built on Promises, you can use React Query with literally any asynchronous data fetching client, including GraphQL!

> Keep in mind that React Query does not support normalized caching. While a vast majority of users do not actually need a normalized cache or even benefit from it as much as they believe they do, there may be very rare circumstances that may warrant it so be sure to check with us first to make sure it's truly something you need!

## Examples

- [basic-graphql-request](../docs/examples/basic-graphql-request) (The "basic" example, but implemented with [`graphq-request`](https://github.com/prisma-labs/graphql-request))

---
id: comparisons
title: Comparisons
---

This comparison strives to be as accurate as possible. Feel free to suggest changes using the "Edit this page on Github" link at the bottom.

|                                  | React Query                            | SWR [(Website)](https://github.com/vercel/swr) | Apollo Client [(Website)](https://github.com/apollographql/apollo-client) |
| -------------------------------- | -------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------- |
| Supported Backend                | HTTP / REST / GQL                      | HTTP / REST / GQL                              | GQL, (HTTP / REST 🔶 plugins required)                                    |
| Supported Query Signatures       | Promise                                | Promise                                        | GraphQL Query                                                             |
| Supported Query Keys             | JSON                                   | JSON                                           | GraphQL Query                                                             |
| Query Key Change Detection       | Deep Compare (Serialization)           | Referential Equality (===)                     | Referential Equality (===)                                                |
| Bundle Size                      | [![][bp-react-query]][bpl-react-query] | [![][bp-swr]][bpl-swr]                         | [![][bp-apollo]][bpl-apollo]                                              |
| Queries                          | ✅                                     | ✅                                             | ✅                                                                        |
| Caching                          | ✅                                     | ✅                                             | ✅                                                                        |
| Devtools                         | ✅                                     | -                                              | ✅                                                                        |
| Polling/Intervals                | ✅                                     | ✅                                             | ✅                                                                        |
| Parallel Queries                 | ✅                                     | ✅                                             | ✅                                                                        |
| Dependent Queries                | ✅                                     | ✅                                             | ✅                                                                        |
| Paginated Queries                | ✅                                     | 🔶 Previously, yes?                            | ✅                                                                        |
| Infinite/Incremental Queries     | ✅                                     | 🔶 Previously, yes?                            | ✅                                                                        |
| Auto Garbage Collection          | ✅                                     | -                                              |                                                                           |
| Scroll Recovery                  | ✅                                     | ✅                                             | ✅                                                                        |
| Cache Manipulation               | ✅                                     | ✅                                             | ✅                                                                        |
| Mutation API                     | ✅                                     |                                                | ✅                                                                        |
| Prefetching APIs                 | ✅                                     |                                                | ✅                                                                        |
| Outdated Query Dismisall         | ✅                                     | ✅                                             | ✅                                                                        |
| Query Cancellation               | ✅                                     | -                                              |                                                                           |
| Network Status Refetching        | -                                      | ✅                                             | -                                                                         |
| Window Focus Refetching          | ✅                                     | ✅                                             | -                                                                         |
| Partial Query Matching           | ✅                                     | -                                              | -                                                                         |
| Automatic Refetch after Mutation | -                                      | -                                              | ✅                                                                        |
| React Suspense (Experimental)    | ✅                                     | ✅                                             | -                                                                         |

### Notes

> **Partial query matching** - Because React Query uses deterministic query key serialization, this allows you to manipulate variable groups of queries without having to know each individual query-key that you want to match, eg. you can refetch every query that starts with `todos` in its key, regardless of variables, or you can target specific queries with (or without) variables or nested properties, and even use a filter function to only match queries that pass your specific conditions.

[bp-react-query]: https://badgen.net/bundlephobia/minzip/react-query?label=%20
[bp-swr]: https://badgen.net/bundlephobia/minzip/swr?label=%20
[bp-apollo]: https://badgen.net/bundlephobia/minzip/@apollo/client?label=%20
[bpl-react-query]: https://bundlephobia.com/result?p=react-query
[bpl-swr]: https://bundlephobia.com/result?p=swr
[bpl-apollo]: https://bundlephobia.com/result?p=@apollo/client

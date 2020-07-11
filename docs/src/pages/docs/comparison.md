---
id: comparison
title: Comparison
---

> This comparison table strives to be as accurate and as unbiased as possible. If you use any of these libraries and feel the information could be improved, feel free to suggest changes (with notes or evidence of claims) using the "Edit this page on Github" link at the bottom of this page.

Feature/Capability Key:

- ✅ 1st-class, built-in, and ready to use with no added configuration or code
- 🟡 Supported, but as an unoffical 3rd party or community library/contribution
- 🔶 Supported and documented, but requires extra user-code to implement
- 🛑 Not officially supported or documented.

|                                              | React Query                            | SWR [(Website)](https://github.com/vercel/swr) | Apollo Client [(Website)](https://github.com/apollographql/apollo-client) |
| -------------------------------------------- | -------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------- |
| Supported Protocol                           | HTTP                                   | HTTP                                           | GraphQL                                                                   |
| Supported Query Signatures                   | Promise                                | Promise                                        | GraphQL Query                                                             |
| Supported Query Keys                         | JSON                                   | JSON                                           | GraphQL Query                                                             |
| Query Key Change Detection                   | Deep Compare (Serialization)           | Referential Equality (===)                     | Deep Compare (Serialization)                                                |
| Bundle Size                                  | [![][bp-react-query]][bpl-react-query] | [![][bp-swr]][bpl-swr]                         | [![][bp-apollo]][bpl-apollo]                                              |
| Queries                                      | ✅                                     | ✅                                             | ✅                                                                        |
| Caching                                      | ✅                                     | ✅                                             | ✅                                                                        |
| Devtools                                     | ✅                                     | 🟡                                             | ✅                                                                        |
| Polling/Intervals                            | ✅                                     | ✅                                             | ✅                                                                        |
| Parallel Queries                             | ✅                                     | ✅                                             | ✅                                                                        |
| Dependent Queries                            | ✅                                     | ✅                                             | ✅                                                                        |
| Paginated/Infinite Queries                   | ✅                                     | ✅ +(~2kb)                                     | ✅                                                                        |
| Initial Data                                 | ✅                                     | ✅                                             | ✅                                                                        |
| Scroll Recovery                              | ✅                                     | ✅                                             | ✅                                                                        |
| Cache Manipulation                           | ✅                                     | ✅                                             | ✅                                                                        |
| Outdated Query Dismissal                     | ✅                                     | ✅                                             | ✅                                                                        |
| Auto Garbage Collection                      | ✅                                     | 🛑                                             | 🛑                                                                        |
| Mutation Hooks                               | ✅                                     | 🛑                                             | ✅                                                                        |
| Prefetching APIs                             | ✅                                     | 🔶                                             | ✅                                                                        |
| Query Cancellation                           | ✅                                     | 🛑                                             | 🛑                                                                        |
| Partial Query Matching<sup>1</sup>           | ✅                                     | 🛑                                             | 🛑                                                                        |
| Window Focus Refetching                      | ✅                                     | ✅                                             | 🛑                                                                        |
| Network Status Refetching                    | 🛑                                     | ✅                                             | ✅                                                                        |
| Automatic Refetch after Mutation<sup>2</sup> | 🔶                                     | 🔶                                             | ✅                                                                        |
| Cache Dehydration/Rehydration                | 🛑                                     | 🛑                                             | ✅                                                                        |
| React Suspense (Experimental)                | ✅                                     | ✅                                             | 🛑                                                                        |

### Notes

> **<sup>1</sup> Partial query matching** - Because React Query uses deterministic query key serialization, this allows you to manipulate variable groups of queries without having to know each individual query-key that you want to match, eg. you can refetch every query that starts with `todos` in its key, regardless of variables, or you can target specific queries with (or without) variables or nested properties, and even use a filter function to only match queries that pass your specific conditions.

> **<sup>2</sup> Automatic Refetch after Mutation** - For truly automatic refetching to happen after a mutation occurs, a schema is necessary (like the one graphQL provides) along with heuristics that help the library know how to identify individual entities and entities types in that schema.

[bp-react-query]: https://badgen.net/bundlephobia/minzip/react-query?label=%20
[bp-swr]: https://badgen.net/bundlephobia/minzip/swr?label=%20
[bp-apollo]: https://badgen.net/bundlephobia/minzip/@apollo/client?label=%20
[bpl-react-query]: https://bundlephobia.com/result?p=react-query
[bpl-swr]: https://bundlephobia.com/result?p=swr
[bpl-apollo]: https://bundlephobia.com/result?p=@apollo/client

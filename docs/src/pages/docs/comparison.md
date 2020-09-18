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

|                                              | React Query                            | SWR [_(Website)_][swr]     | Apollo Client [_(Website)_][apollo]   |
| -------------------------------------------- | -------------------------------------- | -------------------------- | ------------------------------------- |
| Supported Query Syntax                       | Promise, REST, GraphQL                 | Promise, REST, GraphQL     | GraphQL                               |
| Supported Query Keys                         | JSON                                   | JSON                       | GraphQL Query                         |
| Query Key Change Detection                   | Deep Compare (Stable Serialization)    | Referential Equality (===) | Deep Compare (Unstable Serialization) |
| Query Data Memoization Level                 | Query + Structural Sharing             | Query                      | Query + Entity + Structural Sharing   |
| Bundle Size                                  | [![][bp-react-query]][bpl-react-query] | [![][bp-swr]][bpl-swr]     | [![][bp-apollo]][bpl-apollo]          |
| Queries                                      | ✅                                     | ✅                         | ✅                                    |
| Caching                                      | ✅                                     | ✅                         | ✅                                    |
| Devtools                                     | ✅                                     | 🟡                         | ✅                                    |
| Polling/Intervals                            | ✅                                     | ✅                         | ✅                                    |
| Parallel Queries                             | ✅                                     | ✅                         | ✅                                    |
| Dependent Queries                            | ✅                                     | ✅                         | ✅                                    |
| Paginated Queries                            | ✅                                     | ✅                         | ✅                                    |
| Infinite Queries                             | ✅                                     | ✅                         | ✅                                    |
| Lagged / "Lazy" Queries<sup>1</sup>          | ✅                                     | 🛑                         | 🛑                                    |
| Initial Data                                 | ✅                                     | ✅                         | ✅                                    |
| Scroll Recovery                              | ✅                                     | ✅                         | ✅                                    |
| Cache Manipulation                           | ✅                                     | ✅                         | ✅                                    |
| Outdated Query Dismissal                     | ✅                                     | ✅                         | ✅                                    |
| Render Optimization<sup>2</sup>              | ✅                                     | 🛑                         | 🛑                                    |
| Auto Garbage Collection                      | ✅                                     | 🛑                         | 🛑                                    |
| Mutation Hooks                               | ✅                                     | 🟡                         | ✅                                    |
| Prefetching APIs                             | ✅                                     | 🔶                         | ✅                                    |
| Query Cancellation                           | ✅                                     | 🛑                         | 🛑                                    |
| Partial Query Matching<sup>3</sup>           | ✅                                     | 🛑                         | 🛑                                    |
| Stale While Revalidate                       | ✅                                     | ✅                         | 🛑                                    |
| Stale Time Configuration                     | ✅                                     | 🛑                         | 🛑                                    |
| Window Focus Refetching                      | ✅                                     | ✅                         | 🛑                                    |
| Network Status Refetching                    | ✅                                     | ✅                         | ✅                                    |
| Cache Dehydration/Rehydration                | ✅                                     | 🛑                         | ✅                                    |
| React Suspense (Experimental)                | ✅                                     | ✅                         | 🛑                                    |
| Automatic Refetch after Mutation<sup>4</sup> | 🔶                                     | 🔶                         | ✅                                    |
| Normalized Caching<sup>5</sup>               | 🛑                                     | 🛑                         | ✅                                    |

### Notes

> **<sup>1</sup> Lagged / "Lazy" Queries** - React Query provides a way to continue to see an existing query's data while the next query loads (similar to the same UX that suspense will soon provide natively). This is extremely important when writing pagination UIs or infinite loading UIs where you do not want to show a hard loading state whenever a new query is requested. Other libraries do not have this capability and render a hard loading state for the new query (unless it has been prefetched), while the new query loads.

> **<sup>2</sup> Render Optimization** - React Query has excellent rendering performance. It will only re-render your components when a query is updated. For example because it has new data, or to indicate it is fetching. React Query also batches updates together to make sure your application only re-renders once when multiple components are using the same query. If you are only interested in the `data` or `error` properties, you can reduce the number of renders even more by setting `notifyOnStatusChange` to `false`.

> **<sup>3</sup> Partial query matching** - Because React Query uses deterministic query key serialization, this allows you to manipulate variable groups of queries without having to know each individual query-key that you want to match, eg. you can refetch every query that starts with `todos` in its key, regardless of variables, or you can target specific queries with (or without) variables or nested properties, and even use a filter function to only match queries that pass your specific conditions.

> **<sup>4</sup> Automatic Refetch after Mutation** - For truly automatic refetching to happen after a mutation occurs, a schema is necessary (like the one graphQL provides) along with heuristics that help the library know how to identify individual entities and entities types in that schema.

> **<sup>5</sup> Normalized Caching** - React Query and SWR do not currently support automatic-normalized caching which describes storing entities in a flat architecture to avoid some high-level data duplication.

[swr]: https://github.com/vercel/swr
[apollo]: https://github.com/apollographql/apollo-client
[bp-react-query]: https://badgen.net/bundlephobia/minzip/react-query?label=%20
[bp-swr]: https://badgen.net/bundlephobia/minzip/swr?label=%20
[bp-apollo]: https://badgen.net/bundlephobia/minzip/@apollo/client?label=%20
[bpl-react-query]: https://bundlephobia.com/result?p=react-query
[bpl-swr]: https://bundlephobia.com/result?p=swr
[bpl-apollo]: https://bundlephobia.com/result?p=@apollo/client

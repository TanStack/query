---
id: comparison
title: Comparison | React Query vs SWR vs Apollo vs RTK Query vs React Router
---

> This comparison table strives to be as accurate and as unbiased as possible. If you use any of these libraries and feel the information could be improved, feel free to suggest changes (with notes or evidence of claims) using the "Edit this page on Github" link at the bottom of this page.

Feature/Capability Key:

- ✅ 1st-class, built-in, and ready to use with no added configuration or code
- 🟡 Supported, but as an unofficial 3rd party or community library/contribution
- 🔶 Supported and documented, but requires extra user-code to implement
- 🛑 Not officially supported or documented.

|                                                    | React Query                              | SWR [_(Website)_][swr]                   | Apollo Client [_(Website)_][apollo]        | RTK-Query [_(Website)_][rtk-query]   | React Router [_(Website)_][react-router]                                  |
| -------------------------------------------------- | ---------------------------------------- | ---------------------------------------- | ------------------------------------------ | ------------------------------------ | ------------------------------------------------------------------------- |
| Github Repo / Stars                                | [![][stars-react-query]][gh-react-query] | [![][stars-swr]][gh-swr]                 | [![][stars-apollo]][gh-apollo]             | [![][stars-rtk-query]][gh-rtk-query] | [![][stars-react-router]][gh-react-router]                                |
| Platform Requirements                              | React                                    | React                                    | React, GraphQL                             | Redux                                | React                                                                     |
| Their Comparison                                   |                                          | (none)                                   | (none)                                     | [Comparison][rtk-query-comparison]   | (none)                                                                    |
| Supported Query Syntax                             | Promise, REST, GraphQL                   | Promise, REST, GraphQL                   | GraphQL, Any (Reactive Variables)          | Promise, REST, GraphQL               | Promise, REST, GraphQL                                                    |
| Supported Frameworks                               | React                                    | React                                    | React + Others                             | Any                                  | React                                                                     |
| Caching Strategy                                   | Hierarchical Key -> Value                | Unique Key -> Value                      | Normalized Schema                          | Unique Key -> Value                  | Nested Route -> value                                                     |
| Cache Key Strategy                                 | JSON                                     | JSON                                     | GraphQL Query                              | JSON                                 | Route Path                                                                |
| Cache Change Detection                             | Deep Compare Keys (Stable Serialization) | Deep Compare Keys (Stable Serialization) | Deep Compare Keys (Unstable Serialization) | Key Referential Equality (===)       | Route Change                                                              |
| Data Change Detection                              | Deep Comparison + Structural Sharing     | Deep Compare (via `stable-hash`)         | Deep Compare (Unstable Serialization)      | Key Referential Equality (===)       | Loader Run                                                                |
| Data Memoization                                   | Full Structural Sharing                  | Identity (===)                           | Normalized Identity                        | Identity (===)                       | Identity (===)                                                            |
| Bundle Size                                        | [![][bp-react-query]][bpl-react-query]   | [![][bp-swr]][bpl-swr]                   | [![][bp-apollo]][bpl-apollo]               | [![][bp-rtk-query]][bpl-rtk-query]   | [![][bp-react-router]][bpl-react-router] + [![][bp-history]][bpl-history] |
| API Definition Location                            | Component, External Config               | Component                                | GraphQL Schema                             | External Config                      | Route Tree Configuration                                                  |
| Queries                                            | ✅                                       | ✅                                       | ✅                                         | ✅                                   | ✅                                                                        |
| Cache Persistence                                  | ✅                                       | ✅                                       | ✅                                         | ✅                                   | 🛑 Active Routes Only <sup>8</sup>                                        |
| Devtools                                           | ✅                                       | ✅                                       | ✅                                         | ✅                                   | 🛑                                                                        |
| Polling/Intervals                                  | ✅                                       | ✅                                       | ✅                                         | ✅                                   | 🛑                                                                        |
| Parallel Queries                                   | ✅                                       | ✅                                       | ✅                                         | ✅                                   | ✅                                                                        |
| Dependent Queries                                  | ✅                                       | ✅                                       | ✅                                         | ✅                                   | ✅                                                                        |
| Paginated Queries                                  | ✅                                       | ✅                                       | ✅                                         | ✅                                   | ✅                                                                        |
| Infinite Queries                                   | ✅                                       | ✅                                       | ✅                                         | ✅                                   | 🛑                                                                        |
| Bi-directional Infinite Queries                    | ✅                                       | 🔶                                       | 🔶                                         | ✅                                   | 🛑                                                                        |
| Infinite Query Refetching                          | ✅                                       | ✅                                       | 🛑                                         | ✅                                   | 🛑                                                                        |
| Lagged Query Data<sup>1</sup>                      | ✅                                       | ✅                                       | ✅                                         | ✅                                   | ✅                                                                        |
| Selectors                                          | ✅                                       | 🛑                                       | ✅                                         | ✅                                   | N/A                                                                       |
| Initial Data                                       | ✅                                       | ✅                                       | ✅                                         | ✅                                   | ✅                                                                        |
| Scroll Recovery                                    | ✅                                       | ✅                                       | ✅                                         | ✅                                   | ✅                                                                        |
| Cache Manipulation                                 | ✅                                       | ✅                                       | ✅                                         | ✅                                   | 🛑                                                                        |
| Outdated Query Dismissal                           | ✅                                       | ✅                                       | ✅                                         | ✅                                   | ✅                                                                        |
| Render Batching & Optimization<sup>2</sup>         | ✅                                       | ✅                                       | 🛑                                         | ✅                                   | ✅                                                                        |
| Auto Garbage Collection                            | ✅                                       | 🛑                                       | 🛑                                         | ✅                                   | N/A                                                                       |
| Mutation Hooks                                     | ✅                                       | ✅                                       | ✅                                         | ✅                                   | ✅                                                                        |
| Offline Mutation Support                           | ✅                                       | 🛑                                       | 🟡                                         | 🛑                                   | 🛑                                                                        |
| Prefetching APIs                                   | ✅                                       | ✅                                       | ✅                                         | ✅                                   | ✅                                                                        |
| Query Cancellation                                 | ✅                                       | 🛑                                       | 🛑                                         | 🛑                                   | ✅                                                                        |
| Partial Query Matching<sup>3</sup>                 | ✅                                       | 🔶                                       | ✅                                         | ✅                                   | N/A                                                                       |
| Stale While Revalidate                             | ✅                                       | ✅                                       | ✅                                         | ✅                                   | 🛑                                                                        |
| Stale Time Configuration                           | ✅                                       | 🛑<sup>7</sup>                           | 🛑                                         | ✅                                   | 🛑                                                                        |
| Pre-usage Query/Mutation Configuration<sup>4</sup> | ✅                                       | 🛑                                       | ✅                                         | ✅                                   | ✅                                                                        |
| Window Focus Refetching                            | ✅                                       | ✅                                       | 🛑                                         | ✅                                   | 🛑                                                                        |
| Network Status Refetching                          | ✅                                       | ✅                                       | ✅                                         | ✅                                   | 🛑                                                                        |
| General Cache Dehydration/Rehydration              | ✅                                       | 🛑                                       | ✅                                         | ✅                                   | ✅                                                                        |
| Offline Caching                                    | ✅                                       | 🛑                                       | ✅                                         | 🔶                                   | 🛑                                                                        |
| React Suspense                                     | ✅                                       | ✅                                       | ✅                                         | 🛑                                   | ✅                                                                        |
| Abstracted/Agnostic Core                           | ✅                                       | 🛑                                       | ✅                                         | ✅                                   | 🛑                                                                        |
| Automatic Refetch after Mutation<sup>5</sup>       | 🔶                                       | 🔶                                       | ✅                                         | ✅                                   | ✅                                                                        |
| Normalized Caching<sup>6</sup>                     | 🛑                                       | 🛑                                       | ✅                                         | 🛑                                   | 🛑                                                                        |

### Notes

> **<sup>1</sup> Lagged Query Data** - React Query provides a way to continue to see an existing query's data while the next query loads (similar to the same UX that suspense will soon provide natively). This is extremely important when writing pagination UIs or infinite loading UIs where you do not want to show a hard loading state whenever a new query is requested. Other libraries do not have this capability and render a hard loading state for the new query (unless it has been prefetched), while the new query loads.

> **<sup>2</sup> Render Optimization** - React Query has excellent rendering performance. By default, it will automatically track which fields are accessed and only re-render if one of them changes. If you would like to opt-out of this optimization, setting `notifyOnChangeProps` to `'all'` will re-render your components whenever the query is updated. For example because it has new data, or to indicate it is fetching. React Query also batches updates together to make sure your application only re-renders once when multiple components are using the same query. If you are only interested in the `data` or `error` properties, you can reduce the number of renders even more by setting `notifyOnChangeProps` to `['data', 'error']`.

> **<sup>3</sup> Partial query matching** - Because React Query uses deterministic query key serialization, this allows you to manipulate variable groups of queries without having to know each individual query-key that you want to match, eg. you can refetch every query that starts with `todos` in its key, regardless of variables, or you can target specific queries with (or without) variables or nested properties, and even use a filter function to only match queries that pass your specific conditions.

> **<sup>4</sup> Pre-usage Query Configuration** - This is simply a fancy name for being able to configure how queries and mutations will behave before they are used. For instance, a query can be fully configured with defaults beforehand and when the time comes to use it, only `useQuery({ queryKey })` is necessary, instead of being required to pass the fetcher and/or options with every usage. SWR does have a partial form of this feature by allowing you to pre-configure a default fetcher, but only as a global fetcher, not on a per-query basis and definitely not for mutations.

> **<sup>5</sup> Automatic Refetch after Mutation** - For truly automatic refetching to happen after a mutation occurs, a schema is necessary (like the one graphQL provides) along with heuristics that help the library know how to identify individual entities and entities types in that schema.

> **<sup>6</sup> Normalized Caching** - React Query, SWR and RTK-Query do not currently support automatic-normalized caching which describes storing entities in a flat architecture to avoid some high-level data duplication.

> **<sup>7</sup> SWR's Immutable Mode** - SWR ships with an "immutable" mode that does allow you to only fetch a query once for the life of the cache, but it still does not have the concept of stale-time or conditional auto-revalidation

> **<sup>8</sup> React Router cache persistence** - React Router does not cache data beyond the currently matched routes. If a route is left, its data is lost.

[bpl-react-query]: https://bundlephobia.com/result?p=react-query
[bp-react-query]: https://badgen.net/bundlephobia/minzip/react-query?label=💾
[gh-react-query]: https://github.com/tannerlinsley/react-query
[stars-react-query]: https://img.shields.io/github/stars/tannerlinsley/react-query?label=%F0%9F%8C%9F
[swr]: https://github.com/vercel/swr
[bp-swr]: https://badgen.net/bundlephobia/minzip/swr?label=💾
[gh-swr]: https://github.com/vercel/swr
[stars-swr]: https://img.shields.io/github/stars/vercel/swr?label=%F0%9F%8C%9F
[bpl-swr]: https://bundlephobia.com/result?p=swr
[apollo]: https://github.com/apollographql/apollo-client
[bp-apollo]: https://badgen.net/bundlephobia/minzip/@apollo/client?label=💾
[gh-apollo]: https://github.com/apollographql/apollo-client
[stars-apollo]: https://img.shields.io/github/stars/apollographql/apollo-client?label=%F0%9F%8C%9F
[bpl-apollo]: https://bundlephobia.com/result?p=@apollo/client
[rtk-query]: https://redux-toolkit.js.org/rtk-query/overview
[rtk-query-comparison]: https://redux-toolkit.js.org/rtk-query/comparison
[rtk-query-bundle-size]: https://redux-toolkit.js.org/rtk-query/comparison#bundle-size
[bp-rtk]: https://badgen.net/bundlephobia/minzip/@reduxjs/toolkit?label=💾
[bp-rtk-query]: https://badgen.net/bundlephobia/minzip/@reduxjs/toolkit?label=💾
[gh-rtk-query]: https://github.com/reduxjs/redux-toolkit
[stars-rtk-query]: https://img.shields.io/github/stars/reduxjs/redux-toolkit?label=🌟
[bpl-rtk]: https://bundlephobia.com/result?p=@reduxjs/toolkit
[bpl-rtk-query]: https://bundlephobia.com/package/@reduxjs/toolkit
[react-router]: https://github.com/remix-run/react-router
[bp-react-router]: https://badgen.net/bundlephobia/minzip/react-router-dom?label=💾
[gh-react-router]: https://github.com/remix-run/react-router
[stars-react-router]: https://img.shields.io/github/stars/remix-run/react-router?label=%F0%9F%8C%9F
[bpl-react-router]: https://bundlephobia.com/result?p=react-router-dom
[bp-history]: https://badgen.net/bundlephobia/minzip/history?label=💾
[bpl-history]: https://bundlephobia.com/result?p=history

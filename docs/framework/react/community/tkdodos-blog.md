---
id: tkdodos-blog
title: TkDodo's Blog
---

TanStack Query maintainer [TkDodo](https://bsky.app/profile/tkdodo.eu) has a series of blog posts about using and working with the library. Some articles show general best practices, but most have an _opinionated_ point of view.

## [#1: Practical React Query](https://tkdodo.eu/blog/practical-react-query)

> An advanced introduction to React Query, showing practical tips that go beyond the docs. It covers explaining the defaults (`staleTime` vs. `gcTime`), concepts like keeping server and client state separate, handling dependencies and creating custom hooks, as well as outlining why the `enabled` option is very powerful. [Read more...](https://tkdodo.eu/blog/practical-react-query)

## [#2: React Query Data Transformations](https://tkdodo.eu/blog/react-query-data-transformations)

> Learn the possibilities to perform the quite common and important task of transforming your data with React Query. From transforming in the `queryFn` to using the `select` option, this article outlines the pros and cons of all the different approaches. [Read more...](https://tkdodo.eu/blog/react-query-data-transformations)

## [#3: React Query Render Optimizations](https://tkdodo.eu/blog/react-query-render-optimizations)

> Let's take a look at what you can do when your component re-renders too often when using React Query. The library is already pretty optimized, but there are still some opt-in features (like `tracked queries`) that you can use to avoid the `isFetching` transition. We're also looking into what `structural sharing` refers to. [Read more...](https://tkdodo.eu/blog/react-query-render-optimizations)

## [#4: Status Checks in React Query](https://tkdodo.eu/blog/status-checks-in-react-query)

> We usually check for `isPending` first before checking for `isError` , but sometimes, checking if `data` is available should be the first thing to do. This article shows how the wrong status check order can negatively impact user experience. [Read more...](https://tkdodo.eu/blog/status-checks-in-react-query)

## [#5: Testing React Query](https://tkdodo.eu/blog/testing-react-query)

> The docs already cover pretty well what you need to do to get started when testing React Query. This article shows some additional tips (like turning off `retries` or silencing the `console`) you might want to follow when testing custom hooks or components using them. It also links to an [example repository](https://github.com/TkDodo/testing-react-query) with tests for success and error states, powered by `mock-service-worker`. [Read more...](https://tkdodo.eu/blog/testing-react-query)

## [#6: React Query and TypeScript](https://tkdodo.eu/blog/react-query-and-type-script)

> Since React Query is written in TypeScript, it has great support for it. This blog post explains the various Generics, how you can leverage type inference to avoid having to explicitly type `useQuery` and friends, what to do with `unknown` errors, how type narrowing works and more! [Read more...](https://tkdodo.eu/blog/react-query-and-type-script)

## [#7: Using WebSockets with React Query](https://tkdodo.eu/blog/using-web-sockets-with-react-query)

> A step-by-step guide on how to make real-time notifications work with React Query, with either event-based subscriptions or pushing full data directly to the client. Applicable to anything from the browser native WebSocket API over Firebase and even GraphQL subscriptions. [Read more...](https://tkdodo.eu/blog/using-web-sockets-with-react-query)

## [#8: Effective React Query Keys](https://tkdodo.eu/blog/effective-react-query-keys)

> Most examples just use a simple String or Array Query Key, but how do you organize your keys effectively once your app grows past a todo list? This article shows how co-location and Query Key Factories can make life easier. [Read more...](https://tkdodo.eu/blog/effective-react-query-keys)

## [#8a: Leveraging the Query Function Context](https://tkdodo.eu/blog/leveraging-the-query-function-context)

> In this amendment to the previous blog post, we look at how we can leverage the Query Function Context and Object Query Keys for maximum safety as our app grows. [Read more...](https://tkdodo.eu/blog/leveraging-the-query-function-context)

## [#9: Placeholder and Initial Data in React Query](https://tkdodo.eu/blog/placeholder-and-initial-data-in-react-query)

> Placeholder and Initial Data are two similar yet different concepts for synchronously showing data instead of a loading spinner to improve an application's UX. This blog post compares the two and outlines the scenarios where each one shines. [Read more...](https://tkdodo.eu/blog/placeholder-and-initial-data-in-react-query)

## [#10: React Query as a State Manager](https://tkdodo.eu/blog/react-query-as-a-state-manager)

> React Query doesn't fetch any data for you - it's a data synchronization tool that excels when used for server state. This article has everything you need to know to make React Query your single source of truth state manager for your async state. You'll learn how to let React Query do it's magic and why customizing `staleTime` might be all you need. [Read more...](https://tkdodo.eu/blog/react-query-as-a-state-manager)

## [#11: React Query Error Handling](https://tkdodo.eu/blog/react-query-error-handling)

> Handling errors is an integral part of working with asynchronous data, especially data fetching. We have to face it: Not all requests will be successful, and not all Promises will be fulfilled. This blog post describes various ways of coping with errors in React Query, such as the error property, using Error Boundaries or onError callbacks, so that you can prepare your application for the cases when "Something went wrong". [Read more...](https://tkdodo.eu/blog/react-query-error-handling)

## [#12: Mastering Mutations in React Query](https://tkdodo.eu/blog/mastering-mutations-in-react-query)

> Mutations are the important, second part necessary to work with server data - for situations where you need to update it. This blog post covers what mutations are and how they are different from queries. You'll learn the difference between `mutate` and `mutateAsync` as well as how you can tie queries and mutations together. [Read more...](https://tkdodo.eu/blog/mastering-mutations-in-react-query)

## [#13: Offline React Query](https://tkdodo.eu/blog/offline-react-query)

> There are many ways to produce promises - which is everything React Query needs - but by far the biggest use-case is data fetching. Very often, that requires an active network connection. But sometimes, especially on mobile devices where, the network connection can be unreliable, you need your app to also work without it. In this article, you'll learn about the different offline strategies React Query offers. [Read more...](https://tkdodo.eu/blog/offline-react-query)

## [#14: React Query and Forms](https://tkdodo.eu/blog/react-query-and-forms)

> Forms tend to blur the line between what is server state and what is client state. In most applications, we would not only like to display state, but also let the user interact with it. This article shows two different approaches as well as some tips and tricks about using React Query with Forms. [Read more...](https://tkdodo.eu/blog/react-query-and-forms)

## [#15: React Query FAQs](https://tkdodo.eu/blog/react-query-fa-qs)

> This article tries to answer the most frequently asked questions about React Query. [Read more...](https://tkdodo.eu/blog/react-query-fa-qs)

## [#16: React Query meets React Router](https://tkdodo.eu/blog/react-query-meets-react-router)

> Remix and React Router are changing the game when thinking about _when_ to fetch data. This article goes into why React Query and Routers that support data loading are a match made in heaven. [Read more...](https://tkdodo.eu/blog/react-query-meets-react-router)

## [#17: Seeding the Query Cache](https://tkdodo.eu/blog/seeding-the-query-cache)

> This blog post shows multiple ways how to get data into your Query Cache _before_ you start rendering to minimize the amount of loading spinners displayed in your app. The options range from prefetching on the server or in your router to seeding cache entries via `setQueryData`. [Read more...](https://tkdodo.eu/blog/seeding-the-query-cache)

## [#18: Inside React Query](https://tkdodo.eu/blog/inside-react-query)

> If you've ever wondered how React Query works under the hood - this post is for you. It explains the architecture (including visuals), starting with the agnostic Query Core and how it communicates with the framework specific adapters. [Read more...](https://tkdodo.eu/blog/inside-react-query)

## [#19: Type-safe React Query](https://tkdodo.eu/blog/type-safe-react-query)

> There's a big difference between "having types" and "being type-safe". This article tries to outline those differences and shows how you can get the best possible type-safety when using React Query together with TypeScript [Read more...](https://tkdodo.eu/blog/type-safe-react-query)

## [#20: You Might Not Need React Query](https://tkdodo.eu/blog/you-might-not-need-react-query)

> If your application doesn’t rely on client-side data fetching, especially when using frameworks like Next.js or Remix with built-in server components, React Query may be unnecessary. That said, it still shines in hybrid use cases (like infinite scrolling or offline support) where its smart caching and revalidation can be invaluable. [Read more...](https://tkdodo.eu/blog/you-might-not-need-react-query)

## [#21: Thinking in React Query](https://tkdodo.eu/blog/thinking-in-react-query)

> React Query isn’t a data-fetching library - it's an async state manager designed to treat parameters as dependencies, optimize refetch behavior via `staleTime`, and encourage declarative patterns where `queryKey` drives cache and updates. A small shift in mindset can dramatically streamline how you use React Query. [Read more...](https://tkdodo.eu/blog/thinking-in-react-query)

## [#22: React Query and React Context](https://tkdodo.eu/blog/react-query-and-react-context)

> React Query lets components independently manage their own data, making them self-sufficient and resilient, but when shared data (like user info fetched higher up) is needed deeper in the tree, React Context can make that implicit dependency explicit and safer. [Read more...](https://tkdodo.eu/blog/react-query-and-react-context)

## [#23: Why You Want React Query](https://tkdodo.eu/blog/why-you-want-react-query)

> While fetching data with `fetch` inside `useEffect` may seem simple, it quickly gets tangled with bugs like race conditions, missing loading states, stale data, and Strict Mode quirks—making async state management far more complex than it appears. [Read more...](https://tkdodo.eu/blog/why-you-want-react-query)

## [#24: The Query Options API](https://tkdodo.eu/blog/the-query-options-api)

> React Query v5 introduces a unified "Query Options" API - where all functions like `useQuery`, `invalidateQueries`, and imperative calls accept a single object - simplifying the interface and making reuse across different query contexts much easier while at the same time improving type-safety. [Read more...](https://tkdodo.eu/blog/the-query-options-api)

## [#25: Automatic Query Invalidation after Mutations](https://tkdodo.eu/blog/automatic-query-invalidation-after-mutations)

> React Query doesn’t automatically tie mutations to queries - but you can leverage "global cache callbacks" in a central `MutationCache` to define shared behaviors like invalidating queries on every mutation. [Read more...](https://tkdodo.eu/blog/automatic-query-invalidation-after-mutations)

## [#26: How Infinite Queries work](https://tkdodo.eu/blog/how-infinite-queries-work)

> This blog post is a deep dive into how Infinite Queries are designed and work under the hood. Interestingly, there is no distinct InfiniteQuery representation - just a different "behaviour" attached to regular Queries. [Read more...](https://tkdodo.eu/blog/how-infinite-queries-work)

## [#27: React Query API Design - Lessons Learned](https://tkdodo.eu/blog/react-query-api-design-lessons-learned)

> In this talk, Dominik walks us through some of the API design choices that were made in React Query to get to its arguably good developer experience. You'll hear stories about things that went well, but also about tradeoffs and mistakes that were made, and what lessons we can all learn from those. [Read more...](https://tkdodo.eu/blog/react-query-api-design-lessons-learned)

## [#28: React Query - The Bad Parts](https://tkdodo.eu/blog/react-query-the-bad-parts)

> In this talk, Dominik explores the less favorable aspects of React Query and situations where it may not be the best fit. No library is perfect; every choice involves trade-offs. By the end of this talk, you'll have a better understanding of React Query's limitations and why it remains a compelling choice despite them. [Read more...](https://tkdodo.eu/blog/react-query-the-bad-parts)

## [#29: Concurrent Optimistic Updates in React Query](https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query)

> Optimistic updates in React Query can cause race conditions when multiple mutations run at once, leading to inconsistent UI states. Cancelling in-flight queries helps, but overlapping invalidations may still overwrite newer updates. [Read more...](https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query)

## [#30: React Query Selectors, Supercharged](https://tkdodo.eu/blog/react-query-selectors-supercharged)

> React Query’s `select` option enables components to subscribe only to the specific part of a query’s data they care about - so updating one field won’t cause unrelated UI to re-render unnecessarily. This fine-grained approach keeps full responses in the cache while optimizing component updates for performance. [Read more...](https://tkdodo.eu/blog/react-query-selectors-supercharged)

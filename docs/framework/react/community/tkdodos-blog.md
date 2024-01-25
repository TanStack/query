---
id: tkdodos-blog
title: TkDodo's Blog
---

React Query maintainer [TkDodo](https://twitter.com/tkdodo) has a series of blog posts about using and working with the library. Some articles show general best practices, but most have an _opinionated_ point of view.


## [#1: Practical React Query](https://tkdodo.eu/blog/practical-react-query)

> An advanced introduction to React Query, showing practical tips that go beyond the docs. It covers explaining the defaults (`staleTime` vs. `cacheTime`), concepts like keeping server and client state separate, handling dependencies and creating custom hooks, as well as outlining why the `enabled` option is very powerful. [Read more...](https://tkdodo.eu/blog/practical-react-query)

## [#2: React Query Data Transformations](https://tkdodo.eu/blog/react-query-data-transformations)

> Learn the possibilities to perform the quite common and important task of transforming your data with React Query. From transforming in the `queryFn` to using the `select` option, this article outlines the pros and cons of all the different approaches. [Read more...](https://tkdodo.eu/blog/react-query-data-transformations)

## [#3: React Query Render Optimizations](https://tkdodo.eu/blog/react-query-render-optimizations)

> Let's take a look at what you can do when your component re-renders too often when using React Query. The library is already pretty optimized, but there are still some opt-in features (like `tracked queries`) that you can use to avoid the `isFetching` transition. We're also looking into what `structural sharing` refers to. [Read more...](https://tkdodo.eu/blog/react-query-render-optimizations)

## [#4: Status Checks in React Query](https://tkdodo.eu/blog/status-checks-in-react-query)

> We usually check for `isLoading` first before checking for `isError` , but sometimes, checking if `data` is available should be the first thing to do. This article shows how the wrong status check order can negatively impact user experience. [Read more...](https://tkdodo.eu/blog/status-checks-in-react-query)

## [#5: Testing React Query](https://tkdodo.eu/blog/testing-react-query)

> The docs already cover pretty well what you need to do to get started when testing React Query. This article shows some additional tips (like turning off `retries` or silencing the `console`) you might want to follow when testing custom hooks or components using them. It also links to an [example repository](https://github.com/TkDodo/testing-react-query) with tests for success and error states, powered by `mock-service-worker`. [Read more...](https://tkdodo.eu/blog/testing-react-query)

## [#6: React Query and TypeScript](https://tkdodo.eu/blog/react-query-and-type-script)

> Since React Query is written in TypeScript, it has great support for it. This blog post explains the various Generics, how you can leverage type inference to avoid having to explicitly type `useQuery` and friends, what to do with `unknown` errors, how type narrowing works and more! [Read more...](https://tkdodo.eu/blog/react-query-and-type-script)

## [#7: Using WebSockets with React Query](https://tkdodo.eu/blog/using-web-sockets-with-react-query)

> A step-by-step guide on how to make real-time notifications work with React Query, with either event-based subscriptions or pushing full data directly to the client. Applicable to anything from the browser native WebSocket API over Firebase and even GraphQL subscriptions. [Read more...](https://tkdodo.eu/blog/using-web-sockets-with-react-query)

## [#8: Effective React Query Keys](https://tkdodo.eu/blog/effective-react-query-keys)

> Most examples just use a simple String or Array Query Key, but how do you organize your keys effectively once your app grows past a todo list? This article shows how co-location and Query Key Factories can make life easier. [Read more...](https://tkdodo.eu/blog/effective-react-query-keys)

## [#9: Placeholder and Initial Data in React Query](https://tkdodo.eu/blog/placeholder-and-initial-data-in-react-query)

> Placeholder and Initial Data are two similar yet different concepts for synchronously showing data instead of a loading spinner to improve an application's UX. This blog post compares the two and outlines the scenarios where each one shines. [Read more...](https://tkdodo.eu/blog/placeholder-and-initial-data-in-react-query)

## [#10: React Query as a State Manager](https://tkdodo.eu/blog/react-query-as-a-state-manager)

> React Query doesn't fetch any data for you - it's a data synchronization tool that excels when used for server state. This article has everything you need to know to make React Query your single source of truth state manager for your async state. You'll learn how to let React Query do it's magic and why customizing `staleTime` might be all you need. [Read more...](https://tkdodo.eu/blog/react-query-as-a-state-manager)

## [#11: React Query Error Handling](https://tkdodo.eu/blog/react-query-error-handling)

> Handling errors is an integral part of working with asynchronous data, especially data fetching. We have to face it: Not all requests will be successful, and not all Promises will be fulfilled. This blog post describes various ways of coping with errors in React Query, such as the error property, using Error Boundaries or onError callbacks, so that you can prepare your application for the cases when "Something went wrong". [Read more...](https://tkdodo.eu/blog/react-query-error-handling)

## [#12: Mastering Mutations in React Query](https://tkdodo.eu/blog/mastering-mutations-in-react-query)

> Mutations are the important, second part necessary to work with server data - for situations where you need to update it. This blog post covers what mutations are and how they are different from queries. You'll learn the difference between `mutate` and `mutateAsync` as well as how you can tie queries and mutations together. [Read more...](https://tkdodo.eu/blog/mastering-mutations-in-react-query)

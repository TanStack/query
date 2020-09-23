---
id: does-this-replace-client-state
title: Does React Query replace Redux, MobX or other global state managers?
---

Well, let's start with a few important items:

- React Query is a **server-state** library, responsible for managing asynchronous operations between your server and client
- Redux, MobX, Zustand, etc. are **client-state** libraries that _can be used to store asynchronous data, albeit inefficiently when compared to a tool like React Query_

With those points in mind, the short answer is that React Query will likely replace _almost all of your **asynchronous** code that you currently pipe through your **client** state management library_.

For a vast majority of applications, the **client** state that is left over after migrating all of your async code to React Query is usually very miniscule. In rare cicurmstances, an application might indeed have a massive amount of synchronous client-only state (like a visual designer or music production application), in which case, you will probably still want a client state manager. And that's fine, you can use React Query along side client state managers without any issues!

So as _probable side-effect_, **yes**. React Query can replace Redux, MobX or any other global state manager, if you are primarily using it to cache your server-side data.

## A more detailed example

Here we have some "global" state being managed by a global state library:

```js
const globalState = {
  projects,
  teams,
  tasks,
  users,
  themeMode,
  sidebarOpen,
}
```

Currently, the global state manager is caching 4 types of server-state: `projects`, `teams`, `tasks`, and `users`. If we were to move these server-state assets to React Query, our remaining global state would look more like this:

```js
const globalState = {
  themeMode,
  sidebarOpen,
}
```

This also means that with a few hook calls to `useQuery` and `useMutation`, we also get to remove any boilerplate code that use to manage our server state eg.

- Connectors
- Action Creators
- Middlewares
- Reducers
- Loading/Error/Result states
- Contexts

With all of those things removed, you may ask yourself, \*\*"Is it worth it to keep using our client state manager for this tiny global state?"

That's up to you! But React Query's role is clear. It removes asynchronous wiring and boilerplate from your application and replaces it with just a few lines of code.

What are you waiting for, give it a go already!

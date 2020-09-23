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

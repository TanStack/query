![TanStack Query Header](https://github.com/TanStack/query/raw/main/media/repo-header.png)

[![npm version](https://img.shields.io/npm/v/@tanstack/angular-query-experimental)](https://www.npmjs.com/package/@tanstack/angular-query-experimental)
[![npm license](https://img.shields.io/npm/l/@tanstack/angular-query-experimental)](https://github.com/TanStack/query/blob/main/LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@tanstack/angular-query-experimental)](https://bundlephobia.com/package/@tanstack/angular-query-experimental)
[![npm](https://img.shields.io/npm/dm/@tanstack/angular-query-experimental)](https://www.npmjs.com/package/@tanstack/angular-query-experimental)

# Angular Query

> IMPORTANT: This library is currently in an experimental stage. This means that breaking changes will happen in minor AND patch releases. Upgrade carefully. If you use this in production while in experimental stage, please lock your version to a patch-level version to avoid unexpected breaking changes.

Functions for fetching, caching and updating asynchronous data in Angular

# Documentation

Visit https://tanstack.com/query/latest/docs/framework/angular/overview

## Quick Features

- Transport/protocol/backend agnostic data fetching (REST, GraphQL, promises, whatever!)
- Auto Caching + Refetching (stale-while-revalidate, Window Refocus, Polling/Realtime)
- Parallel + Dependent Queries
- Mutations + Reactive Query Refetching
- Multi-layer Cache + Automatic Garbage Collection
- Paginated + Cursor-based Queries
- Load-More + Infinite Scroll Queries w/ Scroll Recovery
- Request Cancellation
- Dedicated Devtools

# Quick Start

> Angular Query requires Angular 16.

1. Install `angular-query`

   ```bash
   $ npm i @tanstack/angular-query-experimental
   # or
   $ pnpm add @tanstack/angular-query-experimental
   # or
   $ yarn add @tanstack/angular-query-experimental
   # or
   $ bun add @tanstack/angular-query-experimental
   ```

2. Initialize **Angular Query** by adding **provideAngularQuery** to your application

   ```ts
   import { provideAngularQuery } from '@tanstack/angular-query-experimental'
   import { QueryClient } from '@tanstack/angular-query-experimental'

   bootstrapApplication(AppComponent, {
     providers: [provideAngularQuery(new QueryClient())],
   })
   ```

   or in a NgModule-based app

   ```ts
   import { provideHttpClient } from '@angular/common/http'
   import {
   provideAngularQuery,
   QueryClient,
   } from '@tanstack/angular-query-experimental'

   @NgModule({
     declarations: [AppComponent],
     imports: [BrowserModule],
     providers: [provideAngularQuery(new QueryClient())],
     bootstrap: [AppComponent],
   })
   ```

3. Inject query

   ```ts
   import { injectQuery } from '@tanstack/angular-query-experimental'
   import { Component } from '@angular/core'

   @Component({...})
   export class TodosComponent {
     info = injectQuery(() => ({ queryKey: ['todos'], queryFn: fetchTodoList }))
   }
   ```

4. If you need to update options on your query dynamically, make sure to pass them as signals

   ```ts
   import { injectQuery } from '@tanstack/angular-query-experimental'
   import { signal, Component } from '@angular/core'

   @Component({...})
   export class TodosComponent {
     id = signal(1)
     enabled = signal(false)

     info = injectQuery(() => ({
       queryKey: ['todos', this.id()],
       queryFn: fetchTodoList,
       enabled: this.enabled(),
     }))
   }
   ```

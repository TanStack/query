---
id: persist-localstorage
title: Persist - LocalStorage (Experimental)
---

> VERY IMPORTANT: This plugin is currently in an experimental stage. This means that breaking changes will happen in minor and patch releases. Use at your own risk. If you choose to rely on this in production in an experimental stage, please lock your version to a patch-level version to avoid unexpected breakages.

## Installation

This plugin comes packaged with `react-query` and is available under the `react-query/persist-localstorage-experimental` import.

## Usage

Import the `persistWithLocalStorage` function, and pass it your `QueryClient` instance!

```js
import { persistWithLocalStorage } from 'react-query/persist-localstorage-experimental'

const queryClient = new QueryClient()

persistWithLocalStorage(queryClient)
```

## How does it work?

As you use your application:

- When your query/mutation cache is updated, it will be dehydrated and serialized into localstorage. **By default**, this action is throttled to happen at most every 1 second to save on potentially expensive writes to localstorage, but can be customized as you see fit.

When you reload/bootstrap your app:

- Attempts to load a previously persisted dehydrated query/mutation cache from localstorage
- If a cache is found that is older than the `maxAge` (which by default is 24 hours), it will be discarded. This can be customized as you see fit.

## Cache Busting

Sometimes you may make changes to your application or data that immediately invalidate any and all cached data. If and when this happens, you can pass a `buster` string option to `persistWithLocalStorage`, and if the cache that is found does not also have that buster string, it will be discarded.

```js
persistWithLocalStorage(queryClient, { buster: buildHash })
```

## API

### `persistWithLocalStorage`

Pass this function a `QueryClient` instance to persist it to localstorage.

```js
persistWithLocalStorage(queryClient, options)
```

### `Options`

An optional object of options:

```js
interface Options {
  /** The key to use when storing the cache to localstorage */
  localStorageKey?: string
  /** To avoid localstorage spamming,
   * pass a time in ms to throttle saving the cache to disk */
  throttleTime?: number
  /** The max-allowed age of the cache.
   * If a persisted cache is found that is older than this
   * time, it will be discarded */
  maxAge?: number
  /** A unique string that can be used to forcefully
   * invalidate existing caches if they do not share the same buster string */
  buster?: string
}
```

The default options are:

```js
{
  localStorageKey = `REACT_QUERY_OFFLINE_CACHE`,
  throttleTime = 1000,
  maxAge = 1000 * 60 * 60 * 24, // 24 hours
  buster = '',
}
```

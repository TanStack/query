---
id: testing
title: Testing
---

Vue Query works by means of composables - either the ones we offer or custom ones that wrap around them.

These composables need the `QueryClient` that `VueQueryPlugin` provides, so they have to run inside the `setup` of a component that has the plugin installed. Writing unit tests for them can be done by means of [Vue Test Utils](https://test-utils.vuejs.org/).

## Setup

Following the [Testing Composables](https://vuejs.org/guide/scaling-up/testing.html#testing-composables) approach of the Vue docs, we write a `withSetup` helper that mounts a component, runs the composable in its `setup` and installs `VueQueryPlugin` with a `QueryClient`. The helper differs between Vue 3 and Vue 2, because they use different major versions of Vue Test Utils.

### Vue 3

Install Vue Test Utils 2 by running:

```sh
npm install @vue/test-utils --save-dev
```

```ts
import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

function withSetup<T>(composable: () => T, queryClient = new QueryClient()) {
  let result!: T
  const wrapper = mount(
    defineComponent({
      setup() {
        result = composable()
        return () => null
      },
    }),
    { global: { plugins: [[VueQueryPlugin, { queryClient }]] } },
  )
  return [result, wrapper] as const
}
```

### Vue 2

Vue Test Utils 1 does not export `flushPromises`, so install the `flush-promises` package along with it:

```sh
npm install @vue/test-utils@1 flush-promises --save-dev
```

```ts
import { defineComponent } from 'vue'
import { createLocalVue, mount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

function withSetup<T>(composable: () => T, queryClient = new QueryClient()) {
  let result!: T
  const localVue = createLocalVue()
  localVue.use(VueQueryPlugin, { queryClient })
  const wrapper = mount(
    defineComponent({
      setup() {
        result = composable()
        return () => null
      },
    }),
    { localVue },
  )
  return [result, wrapper] as const
}
```

With Vue 2.6, also call `localVue.use(VueCompositionApi)` before installing `VueQueryPlugin`, and import `VueCompositionApi` and `defineComponent` from `@vue/composition-api`.

## Our First Test

Once set up, a simple test can be written. Given the following custom composable:

```ts
export function useCustomComposable() {
  return useQuery({ queryKey: ['customComposable'], queryFn: () => 'Hello' })
}
```

We can write a test for this as follows:

```ts
const [result, wrapper] = withSetup(() => useCustomComposable())

await flushPromises()

expect(result.isSuccess.value).toBe(true)
expect(result.data.value).toEqual('Hello')

wrapper.unmount()
```

With Vue Test Utils 1, call `wrapper.destroy()` instead of `wrapper.unmount()`.

Note that `withSetup` creates a new `QueryClient` for every call. This helps to ensure that our test is completely isolated from any other tests. Unmounting the wrapper at the end of the test removes the query observers that the composable created.

It is possible to share a single `QueryClient` between tests, but if so we need to ensure that the `QueryClient` gets cleared before every test, and that tests don't run in parallel otherwise one test will influence the results of others.

`flushPromises` is enough here because the query function resolves right away. When the query function waits on a timer, use fake timers and advance them, for example with [`vi.advanceTimersByTimeAsync`](https://vitest.dev/api/vi.html#vi-advancetimersbytimeasync) in Vitest. Restore real timers in `afterEach`, so they are restored even when an assertion fails:

```ts
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

it('should resolve the delayed query', async () => {
  const [result, wrapper] = withSetup(() =>
    useQuery({
      queryKey: ['delayed'],
      queryFn: () =>
        new Promise((resolve) => setTimeout(() => resolve('Hello'), 1000)),
    }),
  )

  await vi.advanceTimersByTimeAsync(1000)

  expect(result.data.value).toEqual('Hello')

  wrapper.unmount()
})
```

When the query function waits on a real request, wait until the assertion passes instead, for example with [`vi.waitFor`](https://vitest.dev/api/vi.html#vi-waitfor):

```ts
await vi.waitFor(() => expect(result.isSuccess.value).toBe(true))
```

For more complex composables, it can be easier to test the component that uses them instead, by mounting it with the same plugin setup and asserting on what it renders.

## Turn off retries

The library defaults to three retries with exponential backoff, which means that your tests are likely to timeout if you want to test an erroneous query. The easiest way to turn retries off is via the `QueryClient` that you pass to `VueQueryPlugin`. Let's extend the above example:

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ✅ turns retries off
      retry: false,
    },
  },
})

const [result, wrapper] = withSetup(() => useCustomComposable(), queryClient)
```

This will set the defaults for all queries in the app to "no retries". It is important to know that this will only work if your actual `useQuery` has no explicit retries set. If you have a query that wants 5 retries, this will still take precedence, because defaults are only taken as a fallback.

## Set gcTime to Infinity with Jest

If you use Jest, you can set the `gcTime` to `Infinity` to prevent "Jest did not exit one second after the test run completed" error message. This is the default behavior on the server, and is only necessary to set if you are explicitly setting a `gcTime`.

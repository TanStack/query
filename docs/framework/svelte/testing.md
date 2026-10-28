---
id: testing
title: Testing
---

Svelte Query works by means of functions like `createQuery`, either the ones we offer or custom ones that wrap around them. They read the `QueryClient` from the Svelte context that `QueryClientProvider` sets, or from the `QueryClient` accessor you pass as their last argument.

Following the [testing guide](https://svelte.dev/docs/svelte/testing) of the Svelte docs, you can test these functions inside `$effect.root` in a `.svelte.test.ts` file, and test components with [Svelte Testing Library](https://testing-library.com/docs/svelte-testing-library/intro/).

## Setup

Install Vitest, jsdom, and Svelte Testing Library by running:

```sh
npm install vitest jsdom @testing-library/svelte @testing-library/jest-dom --save-dev
```

Then add the `svelteTesting` plugin and a setup file for the `jest-dom` matchers to your Vite config:

**vite.config.ts**

```ts
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { svelteTesting } from '@testing-library/svelte/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [svelte(), svelteTesting()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest-setup.ts'],
  },
})
```

**vitest-setup.ts**

```ts
import '@testing-library/jest-dom/vitest'
```

In a SvelteKit project, use the `sveltekit()` plugin from `@sveltejs/kit/vite` instead of `svelte()`.

## Our First Test

Given the following query options, shared with [`queryOptions`](./reference/functions/queryOptions.md):

**queries.ts**

```ts
import { queryOptions } from '@tanstack/svelte-query'

export const greetingOptions = queryOptions({
  queryKey: ['greeting'],
  queryFn: () =>
    new Promise<string>((resolve) => setTimeout(() => resolve('Hello'), 10)),
})
```

There is no Svelte context outside of a component, so pass a fresh `QueryClient` to `createQuery` as its second argument. Create the query inside `$effect.root`, wait until it succeeds, and clean up the effect root in `finally`, so it is cleaned up even when an assertion fails:

**queries.svelte.test.ts**

```ts
import { expect, it, vi } from 'vitest'
import { QueryClient, createQuery } from '@tanstack/svelte-query'
import { greetingOptions } from './queries'
import type { CreateQueryResult } from '@tanstack/svelte-query'

it('should fetch the greeting', async () => {
  const queryClient = new QueryClient()
  let query!: CreateQueryResult<string>
  const cleanup = $effect.root(() => {
    query = createQuery(
      () => greetingOptions,
      () => queryClient,
    )
  })

  try {
    await vi.waitFor(() => expect(query.isSuccess).toBe(true))

    expect(query.data).toBe('Hello')
  } finally {
    cleanup()
  }
})
```

To avoid repeating `$effect.root` and its cleanup in every test, you can also wrap the whole test body with a helper that runs it inside an effect root:

```ts
import { expect, it, vi } from 'vitest'
import { QueryClient, createQuery } from '@tanstack/svelte-query'
import { greetingOptions } from './queries'

function withEffectRoot(fn: () => Promise<void>) {
  return async () => {
    let promise!: Promise<void>
    const cleanup = $effect.root(() => {
      promise = fn()
    })
    try {
      await promise
    } finally {
      cleanup()
    }
  }
}

it(
  'should fetch the greeting',
  withEffectRoot(async () => {
    const queryClient = new QueryClient()
    const query = createQuery(
      () => greetingOptions,
      () => queryClient,
    )

    await vi.waitFor(() => expect(query.isSuccess).toBe(true))

    expect(query.data).toBe('Hello')
  }),
)
```

Note that we create a new `QueryClient` for every test. This helps to ensure that our test is completely isolated from any other tests.

It is possible to share a single `QueryClient` between tests, but if so we need to ensure that the `QueryClient` gets cleared before every test, and that tests don't run in parallel otherwise one test will influence the results of others.

`query` is reactive, so read its properties after waiting instead of destructuring them up front. A destructured value keeps the value it had when it was read.

## Testing components

Components read the `QueryClient` from the context that `QueryClientProvider` sets. Given a component that uses the same query options:

**Greeting.svelte**

```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { greetingOptions } from './queries'

  const query = createQuery(() => greetingOptions)
</script>

{#if query.isPending}
  <p>Loading...</p>
{:else if query.isError}
  <p>Error: {query.error.message}</p>
{:else}
  <p>{query.data}</p>
{/if}
```

Wrap it in `QueryClientProvider` in a component that only exists for the test:

**GreetingTest.svelte**

```svelte
<script lang="ts">
  import { QueryClientProvider } from '@tanstack/svelte-query'
  import type { QueryClient } from '@tanstack/svelte-query'
  import Greeting from './Greeting.svelte'

  let { queryClient }: { queryClient: QueryClient } = $props()
</script>

<QueryClientProvider client={queryClient}>
  <Greeting />
</QueryClientProvider>
```

Then render it with a fresh `QueryClient` and wait for the data to be rendered:

**Greeting.svelte.test.ts**

```ts
import { render } from '@testing-library/svelte'
import { expect, it } from 'vitest'
import { QueryClient } from '@tanstack/svelte-query'
import GreetingTest from './GreetingTest.svelte'

it('should render the greeting', async () => {
  const rendered = render(GreetingTest, {
    props: { queryClient: new QueryClient() },
  })

  expect(rendered.getByText('Loading...')).toBeInTheDocument()
  expect(await rendered.findByText('Hello')).toBeInTheDocument()
})
```

## Fake timers

`vi.waitFor` and `findByText` retry until the assertion passes, which works for query functions that wait on real requests. When the query function waits on a timer, you can use fake timers and advance them instead, for example with [`vi.advanceTimersByTimeAsync`](https://vitest.dev/api/vi.html#vi-advancetimersbytimeasync). Restore real timers in `afterEach`, so they are restored even when an assertion fails:

```ts
import { render } from '@testing-library/svelte'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/svelte-query'
import GreetingTest from './GreetingTest.svelte'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

it('should render the greeting', async () => {
  const rendered = render(GreetingTest, {
    props: { queryClient: new QueryClient() },
  })

  expect(rendered.getByText('Loading...')).toBeInTheDocument()

  await vi.advanceTimersByTimeAsync(10)

  expect(rendered.getByText('Hello')).toBeInTheDocument()
})
```

## Turn off retries

The library defaults to three retries with exponential backoff, which means that your tests are likely to timeout if you want to test an erroneous query. The easiest way to turn retries off is via the `QueryClient` that you use in the test:

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ✅ turns retries off
      retry: false,
    },
  },
})
```

This will set the defaults for all queries that use this client to "no retries". It is important to know that this will only work if your actual `createQuery` has no explicit retries set. If you have a query that wants 5 retries, this will still take precedence, because defaults are only taken as a fallback.

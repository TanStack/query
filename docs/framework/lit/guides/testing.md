---
id: testing
title: Testing
---

Lit Query works by means of reactive controllers like `createQueryController`, attached to a host element. A controller reads the `QueryClient` from the nearest connected `QueryClientProvider`, or from the `QueryClient` you pass as its last argument, and subscribes when its host connects to the document.

So, to test a query, connect its host element to the document, wait for the element to update, and assert on what it renders or on the controller's result.

## Setup

This guide uses [Vitest](https://vitest.dev/) with jsdom, like Lit Query's own tests, and the [`jest-dom`](https://github.com/testing-library/jest-dom) matchers. Install them by running:

```sh
npm install vitest jsdom @testing-library/jest-dom --save-dev
```

Then use jsdom and add a setup file that loads the matchers and registers `QueryClientProvider` once:

**vite.config.ts**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest-setup.ts'],
  },
})
```

**vitest-setup.ts**

```ts
import '@testing-library/jest-dom/vitest'
import { QueryClientProvider } from '@tanstack/lit-query'

customElements.define('query-client-provider', QueryClientProvider)
```

## Our First Test

Given the following query options, shared with [`queryOptions`](../reference/functions/queryOptions.md), and an element that uses them:

**queries.ts**

```ts
import { queryOptions } from '@tanstack/lit-query'

export const greetingOptions = queryOptions({
  queryKey: ['greeting'],
  queryFn: () =>
    new Promise<string>((resolve) => setTimeout(() => resolve('Hello'), 10)),
})
```

**greeting-view.ts**

```ts
import { LitElement, html } from 'lit'
import { createQueryController } from '@tanstack/lit-query'
import { greetingOptions } from './queries'

export class GreetingView extends LitElement {
  private readonly greeting = createQueryController(this, greetingOptions)

  render() {
    const query = this.greeting()

    if (query.isPending) return html`<p>Loading...</p>`
    if (query.isError) return html`<p>Error: ${query.error.message}</p>`

    return html`<p>${query.data}</p>`
  }
}

customElements.define('greeting-view', GreetingView)
```

We can render the element under a `QueryClientProvider` with a fresh `QueryClient`, wait for its first update, and then wait until the data is rendered:

**greeting-view.test.ts**

```ts
import { afterEach, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/lit-query'
import type { QueryClientProvider } from '@tanstack/lit-query'
import type { GreetingView } from './greeting-view'
import './greeting-view'

afterEach(() => {
  document.body.replaceChildren()
})

it('should render the greeting', async () => {
  const provider = document.createElement(
    'query-client-provider',
  ) as QueryClientProvider
  provider.client = new QueryClient()
  const view = document.createElement('greeting-view') as GreetingView
  provider.append(view)
  document.body.append(provider)

  await view.updateComplete
  expect(view.shadowRoot).toHaveTextContent('Loading...')

  await vi.waitFor(() => expect(view.shadowRoot).toHaveTextContent('Hello'))
})
```

Removing the elements in `afterEach` disconnects them, so their controllers unsubscribe from the `QueryClient`.

Note that we create a new `QueryClient` for every test. This helps to ensure that our test is completely isolated from any other tests.

It is possible to share a single `QueryClient` between tests, but if so we need to ensure that the `QueryClient` gets cleared before every test, and that tests don't run in parallel otherwise one test will influence the results of others.

## Testing a controller on its own

To test the query without rendering, attach the controller to a host element that only exists for the test, and pass the `QueryClient` as its last argument instead of rendering a provider. Then assert on the controller's result:

```ts
import { afterEach, expect, it, vi } from 'vitest'
import { LitElement } from 'lit'
import { QueryClient, createQueryController } from '@tanstack/lit-query'
import { greetingOptions } from './queries'

afterEach(() => {
  document.body.replaceChildren()
})

it('should fetch the greeting', async () => {
  const queryClient = new QueryClient()

  class TestHost extends LitElement {
    readonly greeting = createQueryController(
      this,
      greetingOptions,
      queryClient,
    )
  }
  customElements.define('test-host', TestHost)

  const host = new TestHost()
  document.body.append(host)

  await vi.waitFor(() => expect(host.greeting().isSuccess).toBe(true))

  expect(host.greeting().data).toBe('Hello')
})
```

Custom element names can only be registered once, so give each test host its own name.

## Fake timers

`vi.waitFor` retries until the assertion passes, which works for query functions that wait on real requests. When the query function waits on a timer, you can use fake timers and advance them instead, for example with [`vi.advanceTimersByTimeAsync`](https://vitest.dev/api/vi.html#vi-advancetimersbytimeasync). Restore real timers in `afterEach`, so they are restored even when an assertion fails:

```ts
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/lit-query'
import type { QueryClientProvider } from '@tanstack/lit-query'
import type { GreetingView } from './greeting-view'
import './greeting-view'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  document.body.replaceChildren()
  vi.useRealTimers()
})

it('should render the greeting', async () => {
  const provider = document.createElement(
    'query-client-provider',
  ) as QueryClientProvider
  provider.client = new QueryClient()
  const view = document.createElement('greeting-view') as GreetingView
  provider.append(view)
  document.body.append(provider)

  await view.updateComplete
  expect(view.shadowRoot).toHaveTextContent('Loading...')

  await vi.advanceTimersByTimeAsync(10)

  expect(view.shadowRoot).toHaveTextContent('Hello')
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

This will set the defaults for all queries that use this client to "no retries". It is important to know that this will only work if your actual `createQueryController` has no explicit retries set. If you have a query that wants 5 retries, this will still take precedence, because defaults are only taken as a fallback.

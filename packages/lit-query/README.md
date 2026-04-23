# @tanstack/lit-query

Lit adapter for `@tanstack/query-core` using Lit reactive controllers.

## Install

```bash
npm install @tanstack/lit-query @tanstack/query-core lit @lit/context
```

For local development in this repository:

```bash
npm install
npm run build
```

## Quick Start

```ts
import { LitElement, html } from 'lit'
import { QueryClient } from '@tanstack/query-core'
import { QueryClientProvider, createQueryController } from '@tanstack/lit-query'

const client = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

class AppProvider extends QueryClientProvider {
  constructor() {
    super()
    this.client = client
  }

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }
}
customElements.define('app-provider', AppProvider)

class UsersView extends LitElement {
  private readonly users = createQueryController(this, {
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/users')
      return response.json() as Promise<Array<{ id: string; name: string }>>
    },
  })

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  render() {
    const query = this.users()
    if (query.isPending) return html`Loading...`
    if (query.isError) return html`Error`
    return html`<ul>
      ${query.data?.map((u) => html`<li>${u.name}</li>`)}
    </ul>`
  }
}
customElements.define('users-view', UsersView)
```

## API Surface (v1)

- `QueryClientProvider`, `useQueryClient`, `resolveQueryClient`
- `createQueryController`
- `createMutationController`
- `createInfiniteQueryController`
- `createQueriesController`
- `useIsFetching`, `useIsMutating`, `useMutationState`
- `queryOptions`, `infiniteQueryOptions`, `mutationOptions`

## Runnable Examples

This repo includes a Vite Lit example app at `examples/lit-query-e2e-app`.
The demo uses a local in-memory mock API (`src/todoApi.ts`) for deterministic behavior.

Run:

```bash
npm run example:install
npm run example:dev
```

Open:

- `http://127.0.0.1:4173/` (full integration demo)
- `http://127.0.0.1:4173/basic-query.html` (query-only runnable example)
- `http://127.0.0.1:4173/mutation.html` (mutation runnable example)

Smoke test:

```bash
npm run example:e2e
```

Focused scenarios:

```bash
npm run example:e2e:query-error
npm run example:e2e:mutation-error
npm run example:e2e:refetch-button
npm run example:e2e:lifecycle-reconnect
npm run example:e2e:lifecycle-contract
```

Run all scenarios:

```bash
npm run example:e2e:all
```

This repo also includes a pagination example app at `examples/lit-query-pagination-app`.
It demonstrates paginated queries, optimistic updates, prefetching, and error recovery against a local API.

Run:

```bash
npm run example:pagination:install
npm run example:pagination:dev
```

Smoke test:

```bash
npm run example:pagination:e2e
```

Focused scenarios:

```bash
npm run example:pagination:e2e:prefetch
npm run example:pagination:e2e:error
npm run example:pagination:e2e:mutations
npm run example:pagination:e2e:boundary
```

Run all scenarios:

```bash
npm run example:pagination:e2e:all
```

Use a different port (optional):

```bash
DEMO_PORT=4180 npm run example:dev
DEMO_PORT=4180 npm run example:e2e:all
```

E2E harness options (optional):

```bash
PW_HTTP_PROBE_TIMEOUT_MS=1000
PW_SERVER_READY_TIMEOUT_MS=30000
PW_WAIT_FOR_TEXT_TIMEOUT_MS=10000
PW_CAPTURE_FAILURE_ARTIFACTS=false
PW_ARTIFACT_DIR=output/playwright
```

This repo also includes an SSR example app at `examples/lit-query-ssr-app`.
It demonstrates explicit `QueryClient` prefetch, SSR render, dehydrate, and hydrate flow for Lit.

Run:

```bash
npm run example:ssr:install
npm run example:ssr:dev
```

Open:

- `http://127.0.0.1:4174/` (SSR example app)

Smoke test:

```bash
npm run example:ssr:e2e
```

That root smoke test runs both the default same-origin SSR flow and the documented `SSR_PUBLIC_ORIGIN=http://localhost:4174` variant.

Focused scenarios:

```bash
npm run example:ssr:e2e:error
npm run example:ssr:e2e:refreshing
```

Run the full default-origin SSR suite plus the documented public-origin smoke:

```bash
npm run example:ssr:e2e:all
```

Run either path directly (optional):

```bash
npm run example:ssr:e2e:default
npm run example:ssr:e2e:public-origin
npm run example:ssr:e2e:all:default
```

Use a different host or port (optional):

```bash
SSR_PORT=4180 npm run example:ssr:dev
SSR_PORT=4180 npm run example:ssr:e2e
SSR_HOST=0.0.0.0 npm run example:ssr:dev
npm run example:ssr:dev:public-origin
```

## Quality Gates

- Core matrix: `docs/TEST_MATRIX.md`
- Integration matrix: `docs/TEST_MATRIX_INTEGRATION.md`
- Perf matrix: `docs/TEST_MATRIX_PERF.md`
- RFC and phase log: `docs/RFC-v4.1.md`

Current local quality gate:

```bash
npm run test:types && npm run test:lib && npm run build && npm run test:build
```

## License

MIT

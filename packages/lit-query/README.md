# @tanstack/lit-query

Lit adapter for `@tanstack/query-core` using Lit reactive controllers.

This package is currently experimental and v0.1. Pin exact versions if you use
it in production while the API is early.

## Install

```bash
npm install @tanstack/lit-query @tanstack/query-core lit
```

For local development in this repository:

```bash
pnpm install
pnpm --dir packages/lit-query run build
```

## Quick Start

```ts
import { LitElement, html } from 'lit'
import {
  QueryClient,
  QueryClientProvider,
  createQueryController,
} from '@tanstack/lit-query'

const client = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

class AppProvider extends QueryClientProvider {
  constructor() {
    super()
    this.client = client
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

## API Surface

- `QueryClientProvider`, `useQueryClient`, `resolveQueryClient`
- `createQueryController`
- `createMutationController`
- `createInfiniteQueryController`
- `createQueriesController`
- `useIsFetching`, `useIsMutating`, `useMutationState`
- `queryOptions`, `infiniteQueryOptions`, `mutationOptions`

## Runnable Examples

This repo includes runnable Lit examples under the top-level `examples/lit`
directory so they can be surfaced in the docs:

- `examples/lit/basic`: Vite Lit app covering query and mutation primitives.
- `examples/lit/pagination`: pagination, prefetching, optimistic updates, and error recovery.
- `examples/lit/ssr`: Lit SSR render, dehydrate, and hydrate flow.

Run an example from the repo root:

```bash
pnpm --dir examples/lit/basic run dev
pnpm --dir examples/lit/pagination run dev
pnpm --dir examples/lit/ssr run dev
```

Open:

- `http://127.0.0.1:4173/` (basic example)
- `http://127.0.0.1:4183/` (pagination example app)
- `http://127.0.0.1:4174/` (SSR example app)

Use a different port (optional):

```bash
DEMO_PORT=4180 pnpm --dir examples/lit/basic run dev
PAGINATION_DEMO_PORT=4181 PAGINATION_API_PORT=4182 pnpm --dir examples/lit/pagination run dev
SSR_PORT=4180 pnpm --dir examples/lit/ssr run dev
SSR_HOST=0.0.0.0 pnpm --dir examples/lit/ssr run dev
```

## Integration Smoke

For the framework build smoke used in CI:

```bash
pnpm --dir integrations/lit-vite run build
```

## Quality Gates

From the repository root:

```bash
pnpm --dir packages/lit-query run test:types
pnpm --dir packages/lit-query run test:lib
pnpm --dir packages/lit-query run build
pnpm --dir packages/lit-query run test:build
```

## License

MIT

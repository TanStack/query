---
id: installation
title: Installation
---

> IMPORTANT: The Lit adapter is currently experimental and v0.1. Pin exact versions if you need extra release stability while the API is early.

Install Lit Query with Lit and TanStack Query Core:

```bash
npm i @tanstack/lit-query @tanstack/query-core lit
```

or

```bash
pnpm add @tanstack/lit-query @tanstack/query-core lit
```

or

```bash
yarn add @tanstack/lit-query @tanstack/query-core lit
```

or

```bash
bun add @tanstack/lit-query @tanstack/query-core lit
```

`@tanstack/query-core` is a peer dependency of `@tanstack/lit-query`. Even though the Lit docs import user-facing APIs from `@tanstack/lit-query`, your app should install `@tanstack/query-core` explicitly.

## Requirements

Lit Query is intended for Lit 2.8 and newer, including Lit 3. It uses Lit reactive controllers and Lit context, so query consumers should be `ReactiveControllerHost` instances such as `LitElement`.

TanStack Query is optimized for modern browsers:

```txt
Chrome >= 91
Firefox >= 90
Edge >= 91
Safari >= 15
iOS >= 15
Opera >= 77
```

## Provider Setup

Create a `QueryClient`, provide it with `QueryClientProvider`, and register your custom element. The package exports the provider class but does not call `customElements.define` for you.

### Subclass Pattern

```ts
import { QueryClient, QueryClientProvider } from '@tanstack/lit-query'

const queryClient = new QueryClient()

class AppQueryProvider extends QueryClientProvider {
  constructor() {
    super()
    this.client = queryClient
  }
}

customElements.define('app-query-provider', AppQueryProvider)
```

```html
<app-query-provider>
  <todos-view></todos-view>
</app-query-provider>
```

### Direct Provider Element

You can register the provider class directly and bind its `client` property from a Lit template. The dot is important: `.client=${queryClient}` is a property binding, not an HTML attribute.

```ts
import { LitElement, html } from 'lit'
import { QueryClient, QueryClientProvider } from '@tanstack/lit-query'

const queryClient = new QueryClient()

customElements.define('query-client-provider', QueryClientProvider)

class AppRoot extends LitElement {
  render() {
    return html`
      <query-client-provider .client=${queryClient}>
        <todos-view></todos-view>
      </query-client-provider>
    `
  }
}
```

If a connected provider has no `client`, it throws. See the generated [`QueryClientProvider` reference](./reference/classes/QueryClientProvider.md) for the full contract.

## Render Roots

The snippets in these docs use Lit's default shadow DOM. Lit Query controllers and `QueryClientProvider` work with shadow DOM and light DOM because they use the host lifecycle and Lit context, not global selectors.

Some runnable examples override `createRenderRoot()` and return `this` so their demo markup stays in light DOM for shared page styles and test selectors. That override is not required for Lit Query. Use light DOM only when your app has a separate reason to expose a component's internal markup to global CSS, tests, or non-shadow-DOM integration code.

## Devtools Status

Lit Devtools are not available yet. This is a current adapter limitation, not an installation step.

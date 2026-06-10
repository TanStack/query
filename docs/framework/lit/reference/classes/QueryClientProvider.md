---
id: QueryClientProvider
title: QueryClientProvider
---

# Class: QueryClientProvider

Defined in: [packages/lit-query/src/QueryClientProvider.ts:64](https://github.com/TanStack/query/blob/main/packages/lit-query/src/QueryClientProvider.ts#L64)

Lit element that provides a `QueryClient` to descendant Lit Query
controllers through Lit context.

The `client` is a property, not an attribute. When rendering this element in
a Lit template, bind it with property binding: `.client=${queryClient}`.
The provider throws if it connects without a client, or if an already
connected provider has its client cleared.

This class is not registered as a custom element by the package. Applications
must register either a subclass or the class itself with
`customElements.define`.

## Examples

```ts
import { html, LitElement } from 'lit'
import { QueryClient, QueryClientProvider } from '@tanstack/lit-query'

const queryClient = new QueryClient()

class AppQueryProvider extends QueryClientProvider {
  constructor() {
    super()
    this.client = queryClient
  }
}

customElements.define('app-query-provider', AppQueryProvider)

class AppRoot extends LitElement {
  render() {
    return html`<app-query-provider><todos-view></todos-view></app-query-provider>`
  }
}
```

```ts
import { html } from 'lit'
import { QueryClient, QueryClientProvider } from '@tanstack/lit-query'

const queryClient = new QueryClient()

customElements.define('query-client-provider', QueryClientProvider)

const view = html`
  <query-client-provider .client=${queryClient}>
    <todos-view></todos-view>
  </query-client-provider>
`
```

## Extends

- `LitElement`

## Constructors

### Constructor

```ts
new QueryClientProvider(): QueryClientProvider;
```

Defined in: [packages/lit-query/src/QueryClientProvider.ts:82](https://github.com/TanStack/query/blob/main/packages/lit-query/src/QueryClientProvider.ts#L82)

#### Returns

`QueryClientProvider`

#### Overrides

```ts
LitElement.constructor
```

## Properties

### client

```ts
client: QueryClient;
```

Defined in: [packages/lit-query/src/QueryClientProvider.ts:76](https://github.com/TanStack/query/blob/main/packages/lit-query/src/QueryClientProvider.ts#L76)

The `QueryClient` provided to descendant controllers and global fallback
helpers while this provider is connected.

Bind this as a property in Lit templates with `.client=${queryClient}`.

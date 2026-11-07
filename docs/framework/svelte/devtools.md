---
id: devtools
title: Devtools
---

> For Chrome, Firefox, and Edge users: Third-party browser extensions are available for debugging TanStack Query directly in browser DevTools. These provide the same functionality as the framework-specific devtools packages:
>
> - <img alt="Chrome logo" src="https://www.google.com/chrome/static/images/chrome-logo.svg" width="16" height="16" class="inline mr-1 not-prose" /> <a href="https://chromewebstore.google.com/detail/tanstack-query-devtools/annajfchloimdhceglpgglpeepfghfai">Devtools for Chrome</a>
> - <img alt="Firefox logo" src="https://upload.wikimedia.org/wikipedia/commons/a/a0/Firefox_logo%2C_2019.svg" width="16" height="16" class="inline mr-1 not-prose" /> <a href="https://addons.mozilla.org/en-US/firefox/addon/tanstack-query-devtools/">Devtools for Firefox</a>
> - <img alt="Edge logo" src="https://upload.wikimedia.org/wikipedia/commons/9/98/Microsoft_Edge_logo_%282019%29.svg" width="16" height="16" class="inline mr-1 not-prose" /> <a href="https://microsoftedge.microsoft.com/addons/detail/tanstack-query-devtools/edmdpkgkacmjopodhfolmphdenmddobj">Devtools for Edge</a>

## Install and Import the Devtools

The devtools are a separate package that you need to install:

```sh
npm i @tanstack/svelte-query-devtools
```

or

```sh
pnpm add @tanstack/svelte-query-devtools
```

or

```sh
yarn add @tanstack/svelte-query-devtools
```

or

```sh
bun add @tanstack/svelte-query-devtools
```

You can import the devtools like this:

```ts
import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'
```

By default, Svelte Query Devtools are only rendered in development, using `DEV` from `esm-env`. In production, the devtools component renders nothing.

## Floating Mode

Floating Mode will mount the devtools as a fixed, floating element in your app and provide a toggle in the corner of the screen to show and hide the devtools. This toggle state will be stored and remembered in localStorage across reloads.

Place the following code as high in your Svelte app as you can. The closer it is to the root of the page, the better it will work!

```ts
<script>
  import { QueryClientProvider } from '@tanstack/svelte-query'
  import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'
</script>

<QueryClientProvider client={queryClient}>
  {/* The rest of your application */}
  <SvelteQueryDevtools />
</QueryClientProvider>
```

### Options

- `initialIsOpen: boolean`
  - Set this `true` if you want the dev tools to default to being open
- `buttonPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "relative"`
  - Defaults to `bottom-right`
  - The position of the TanStack logo to open and close the devtools panel
  - If `relative`, the button is placed in the location that you render the devtools.
- `position?: "top" | "bottom" | "left" | "right"`
  - Defaults to `bottom`
  - The position of the Svelte Query devtools panel
- `client?: QueryClient`,
  - Use this to use a custom QueryClient. Otherwise, the one from the nearest context will be used.
- `errorTypes?: { name: string; initializer: (query: Query) => TError}[]`
  - Use this to predefine some errors that can be triggered on your queries. Initializer will be called (with the specific query) when that error is toggled on from the UI. It must return an Error.
- `styleNonce?: string`
  - Use this to pass a nonce to the style tag that is added to the document head. This is useful if you are using a Content Security Policy (CSP) nonce to allow inline styles.
- `shadowDOMTarget?: ShadowRoot`
  - Default behavior will apply the devtool's styles to the head tag within the DOM.
  - Use this to pass a shadow DOM target to the devtools so that the styles will be applied within the shadow DOM instead of within the head tag in the light DOM.
- `hideDisabledQueries?: boolean`
  - Defaults to `false`.
  - Set this to true to hide disabled queries from the devtools panel.
- `theme?: Theme`
  - Defaults to the theme selected in the devtools Settings menu, or `system` if none is selected.
  - Set this to change the theme of the devtools panel. This overrides the theme selected in the Settings menu.

## Filter queries and mutations

The **Filter** input above the query and mutation lists matches the text shown in each row by default. Select the scope button inside the input to switch between **Key**, **Data**, and **All**:

- **Key** matches what the list shows for each row: the query hash, or the mutation key and submission time.
- **Data** matches the query data, or the mutation variables or data, the same way **Search data** does below.
- **All** matches either.

The selected scope is remembered across reloads, like the other filter settings.

## Search query and mutation data

Select a query or mutation and use **Search data** in its Data Explorer to search nested property names and primitive values. Search uses case-insensitive text matching and treats special characters as plain text.

Matching text is highlighted. Matching editable values have a highlighted input. The explorer opens matching branches and the first matching page in each paginated collection. Other pages with matches are highlighted so you can open them. You can still inspect other rows and edit query data.

The Data Explorer highlights up to 1,000 matches at a time.

Select **Clear** or press **Escape** in the search field to restore your manual expansion. Selecting another query or mutation clears the search, unless the filter scope is **Data** or **All**: then the search starts with the filter text. For a mutation, it starts only in the variables or data that match the filter.

## Devtools in production

Devtools are excluded in production builds. However, it might be desirable to lazy load the devtools in production:

```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'
  import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'
  import Example from './Example.svelte'

  const queryClient = new QueryClient()

  let showDevtools = $state(false)

  onMount(() => {
    Object.assign(window, {
      toggleDevtools: () => (showDevtools = !showDevtools),
    })
  })
</script>

<QueryClientProvider client={queryClient}>
  <Example />
  <SvelteQueryDevtools initialIsOpen />
  {#if showDevtools}
    {#await import('@tanstack/svelte-query-devtools/production') then { SvelteQueryDevtools: SvelteQueryDevtoolsProduction }}
      <SvelteQueryDevtoolsProduction />
    {/await}
  {/if}
</QueryClientProvider>
```

With this, calling `window.toggleDevtools()` will download the devtools bundle and show them.

For TypeScript, you would need to set `moduleResolution` to `'bundler'`, `'node16'`, or `'nodenext'` in your tsconfig.

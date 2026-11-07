---
id: devtools
title: Devtools
---

Wave your hands in the air and shout hooray because Vue Query comes with dedicated devtools! 🥳

When you begin your Vue Query journey, you'll want these devtools by your side. They help visualize all of the inner workings of Vue Query and will likely save you hours of debugging if you find yourself in a pinch!

> For Chrome, Firefox, and Edge users: Third-party browser extensions are available for debugging TanStack Query directly in browser DevTools. These provide the same functionality as the framework-specific devtools packages:
>
> - <img alt="Chrome logo" src="https://www.google.com/chrome/static/images/chrome-logo.svg" width="16" height="16" class="inline mr-1 not-prose" /> <a href="https://chromewebstore.google.com/detail/tanstack-query-devtools/annajfchloimdhceglpgglpeepfghfai">Devtools for Chrome</a>
> - <img alt="Firefox logo" src="https://upload.wikimedia.org/wikipedia/commons/a/a0/Firefox_logo%2C_2019.svg" width="16" height="16" class="inline mr-1 not-prose" /> <a href="https://addons.mozilla.org/en-US/firefox/addon/tanstack-query-devtools/">Devtools for Firefox</a>
> - <img alt="Edge logo" src="https://upload.wikimedia.org/wikipedia/commons/9/98/Microsoft_Edge_logo_%282019%29.svg" width="16" height="16" class="inline mr-1 not-prose" /> <a href="https://microsoftedge.microsoft.com/addons/detail/tanstack-query-devtools/edmdpkgkacmjopodhfolmphdenmddobj">Devtools for Edge</a>

## Component based Devtools (Vue 3)

You can directly integrate the devtools component into your page using a dedicated package.
Component-based devtools use a framework-agnostic implementation and are always up-to-date.

The devtools component is a separate package that you need to install:

```sh
npm i @tanstack/vue-query-devtools
```

or

```sh
pnpm add @tanstack/vue-query-devtools
```

or

```sh
yarn add @tanstack/vue-query-devtools
```

or

```sh
bun add @tanstack/vue-query-devtools
```

By default, Vue Query Devtools are only included in bundles when `process.env.NODE_ENV === 'development'`, so you don't need to worry about excluding them during a production build.

## Floating Mode

Devtools will be mounted as a fixed, floating element in your app and provide a toggle in the corner of the screen to show and hide the devtools. This toggle state will be stored and remembered in localStorage across reloads.

Place the following code as high in your Vue app as you can. The closer it is to the root of the page, the better it will work!

```vue
<script setup>
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
</script>

<template>
  <h1>The app!</h1>
  <VueQueryDevtools />
</template>
```

### Options

- `initialIsOpen: boolean`
  - Set this `true` if you want the dev tools to default to being open.
- `buttonPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "relative"`
  - Defaults to `bottom-right`.
  - The position of the TanStack logo to open and close the devtools panel.
- `position?: "top" | "bottom" | "left" | "right"`
  - Defaults to `bottom`.
  - The position of the Vue Query devtools panel.
- `client?: QueryClient`
  - Use this to use a custom QueryClient. Otherwise, the one from the nearest context will be used.
- `errorTypes?: { name: string; initializer: (query: Query) => TError}[]`
  - Use this to predefine some errors that can be triggered on your queries. The initializer will be called (with the specific query) when that error is toggled on from the UI. It must return an Error.
- `styleNonce?: string`
  - Use this to pass a nonce to the style tag that is added to the document head. This is useful if you are using a Content Security Policy (CSP) nonce to allow inline styles.
- `shadowDOMTarget?: ShadowRoot`
  - Default behavior will apply the devtool's styles to the head tag within the DOM.
  - Use this to pass a shadow DOM target to the devtools so that the styles will be applied within the shadow DOM instead of within the head tag in the light DOM.
- `hideDisabledQueries?: boolean`
  - Defaults to `false`.
  - Set this to true to hide disabled queries from the devtools panel.
- `theme?: "light" | "dark" | "system"`
  - Defaults to the theme selected in the devtools Settings menu, or `system` if none is selected.
  - Set this to change the theme of the devtools panel. This overrides the theme selected in the Settings menu.

## Embedded Mode

Embedded mode will show the development tools as a fixed element in your application, so you can use our panel in your own development tools.

Place the following code as high in your Vue app as you can. The closer it is to the root of the page, the better it will work!

```vue
<script setup>
import { ref } from 'vue'
import { VueQueryDevtoolsPanel } from '@tanstack/vue-query-devtools'

const isOpen = ref(false)
</script>

<template>
  <h1>The app!</h1>
  <button @click="isOpen = !isOpen">
    {{ isOpen ? 'Close' : 'Open' }} the devtools panel
  </button>
  <VueQueryDevtoolsPanel v-if="isOpen" :onClose="() => (isOpen = false)" />
</template>
```

### Options

- `style?: Partial<CSSStyleDeclaration>`
  - Custom styles for the devtools panel
  - Default: `{ height: '500px' }`
  - Example: `{ height: '100%' }`
  - Example: `{ height: '100%', width: '100%' }`
- `onClose?: () => void`
  - Callback function that is called when the devtools panel is closed
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
- `theme?: "light" | "dark" | "system"`
  - Defaults to the theme selected in the devtools Settings menu, or `system` if none is selected.
  - Set this to change the theme of the devtools panel. This overrides the theme selected in the Settings menu.

## Filter queries and mutations

The **Filter** input above the query and mutation lists matches the query or mutation key by default. Select the scope button inside the input to switch between **Key**, **Data**, and **All**:

- **Key** matches the query key or the mutation key.
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

```vue
<script setup>
import { defineAsyncComponent, onMounted, ref } from 'vue'
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'

const VueQueryDevtoolsProduction = defineAsyncComponent(() =>
  import('@tanstack/vue-query-devtools/production').then(
    (d) => d.VueQueryDevtools,
  ),
)

const showDevtools = ref(false)

onMounted(() => {
  Object.assign(window, {
    toggleDevtools: () => (showDevtools.value = !showDevtools.value),
  })
})
</script>

<template>
  <h1>The app!</h1>
  <VueQueryDevtools initialIsOpen />
  <VueQueryDevtoolsProduction v-if="showDevtools" />
</template>
```

With this, calling `window.toggleDevtools()` will download the devtools bundle and show them.

For TypeScript, you would need to set `moduleResolution` to `'bundler'`, `'node16'`, or `'nodenext'` in your tsconfig.

## Traditional Devtools

Vue Query will seamlessly integrate with the [Official Vue devtools](https://github.com/vuejs/devtools-next), adding custom inspector and timeline events.
Devtool code will be treeshaken from production bundles by default.

To make it work, you only need to enable it in the plugin options:

```ts
app.use(VueQueryPlugin, {
  enableDevtoolsV6Plugin: true,
})
```

Both v6 and v7 versions of devtools are supported.

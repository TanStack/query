---
id: devtools
title: Devtools
---

> IMPORTANT: `@tanstack/marko-query-devtools` is experimental, same as `@tanstack/marko-query`. Pin an exact version if you use it in production while the API is early.

Marko Query includes dedicated devtools. They show the queries, mutations, and cache state of the client, and they help diagnose problems during development.

> For Chrome, Firefox, and Edge users: Third-party browser extensions are available for debugging TanStack Query directly in browser DevTools. These provide the same functionality as the framework-specific devtools packages:
>
> - <img alt="Chrome logo" src="https://www.google.com/chrome/static/images/chrome-logo.svg" width="16" height="16" class="inline mr-1 not-prose" /> <a href="https://chromewebstore.google.com/detail/tanstack-query-devtools/annajfchloimdhceglpgglpeepfghfai">Devtools for Chrome</a>
> - <img alt="Firefox logo" src="https://upload.wikimedia.org/wikipedia/commons/a/a0/Firefox_logo%2C_2019.svg" width="16" height="16" class="inline mr-1 not-prose" /> <a href="https://addons.mozilla.org/en-US/firefox/addon/tanstack-query-devtools/">Devtools for Firefox</a>
> - <img alt="Edge logo" src="https://upload.wikimedia.org/wikipedia/commons/9/98/Microsoft_Edge_logo_%282019%29.svg" width="16" height="16" class="inline mr-1 not-prose" /> <a href="https://microsoftedge.microsoft.com/addons/detail/tanstack-query-devtools/edmdpkgkacmjopodhfolmphdenmddobj">Devtools for Edge</a>

## Install and Import the Devtools

The devtools are a separate package that you need to install:

```sh
npm i @tanstack/marko-query-devtools
```

or

```sh
pnpm add @tanstack/marko-query-devtools
```

or

```sh
yarn add @tanstack/marko-query-devtools
```

or

```sh
bun add @tanstack/marko-query-devtools
```

You do not import the devtools tags. The Marko compiler finds `<query-devtools>` and `<query-devtools-panel>` through the `marko.json` file of the package.

By default, Marko Query Devtools are only enabled when `process.env.NODE_ENV === 'development'`. In other builds, the tags load nothing. During development, the devtools load only in the browser, after the tag mounts. On the server, the tags render an empty container element.

If the devtools chunk fails to load, for example when the browser is offline, a deploy is stale, or a Content Security Policy blocks it, the tag logs one warning and the page keeps running without the devtools. The failure does not become an unhandled rejection.

## Floating Mode

Floating mode mounts the devtools as a fixed, floating element and adds a toggle in the corner of the screen to show and hide the panel. The toggle state is stored in localStorage and restored across reloads.

Render the tag as high in the app as possible, for example in the root layout. The closer it is to the root of the page, the better it works.

```marko
// src/routes/+layout.marko
import { createQueryClient } from "../lib/query-client";

<!doctype html>
<html lang="en">
  <body>
    <query-client-factory factory=createQueryClient/>
    <${input.content}/>
    <query-devtools initialIsOpen=false/>
  </body>
</html>
```

### Options

Marko serializes the input of the tags for the browser. So the inputs that hold functions or browser objects are functions that return the value.

- `initialIsOpen?: boolean`
  - Defaults to `false`.
  - Set this `true` if you want the dev tools to default to being open
- `buttonPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "relative"`
  - Defaults to `bottom-right`
  - The position of the TanStack logo to open and close the devtools panel
  - If `relative`, the button is placed in the location that you render the devtools.
- `position?: "top" | "bottom" | "left" | "right"`
  - Defaults to `bottom`
  - The position of the Marko Query devtools panel
- `client?: () => QueryClient`
  - Use this to use a custom QueryClient. Otherwise, the one for this `$global` will be used.
- `errorTypes?: () => { name: string; initializer: (query: Query) => TError }[]`
  - Use this to predefine some errors that can be triggered on your queries. Initializer will be called (with the specific query) when that error is toggled on from the UI. It must return an Error.
- `styleNonce?: string`
  - Use this to pass a nonce to the style tag that is added to the document head. This is useful if you are using a Content Security Policy (CSP) nonce to allow inline styles.
- `shadowDOMTarget?: () => ShadowRoot`
  - Default behavior will apply the devtool's styles to the head tag within the DOM.
  - Use this to pass a shadow DOM target to the devtools so that the styles will be applied within the shadow DOM instead of within the head tag in the light DOM.
- `hideDisabledQueries?: boolean`
  - Defaults to `false`.
  - Set this to true to hide disabled queries from the devtools panel.
  - Read once, when the devtools mount. The devtools package has no setter for it, so a change after mount does not reach the open panel. The devtools Settings menu has its own "Disabled Queries" choice, which it saves in `localStorage` and prefers over this input.
- `theme?: "light" | "dark" | "system"`
  - Defaults to `system`.
  - Set this to change the theme of the devtools panel. The tags always pass a theme to the devtools, so the theme selected in the devtools Settings menu does not apply.

## Embedded Mode

Embedded mode renders the panel as a fixed element in the application, so it can be placed inside your own development tools.

Render the tag as high in the app as possible. The closer it is to the root of the page, the better it works.

```marko
<let/isOpen=false>

<button onClick() { isOpen = !isOpen }>
  ${isOpen ? "Close" : "Open"} the devtools panel
</button>
<if=isOpen>
  <query-devtools-panel onClose() { isOpen = false }/>
</if>
```

### Options

- `style?: Marko.HTML.Div["style"]`
  - Custom styles for the devtools panel
  - Default: `{ height: "500px" }`
  - Example: `{ height: "100%" }`
  - Example: `{ height: "100%", width: "100%" }`
- `onClose?: () => void`
  - Callback function that is called when the devtools panel is closed
- `client?: () => QueryClient`
  - Use this to use a custom QueryClient. Otherwise, the one for this `$global` will be used.
- `errorTypes?: () => { name: string; initializer: (query: Query) => TError }[]`
  - Use this to predefine some errors that can be triggered on your queries. Initializer will be called (with the specific query) when that error is toggled on from the UI. It must return an Error.
- `styleNonce?: string`
  - Use this to pass a nonce to the style tag that is added to the document head. This is useful if you are using a Content Security Policy (CSP) nonce to allow inline styles.
- `shadowDOMTarget?: () => ShadowRoot`
  - Default behavior will apply the devtool's styles to the head tag within the DOM.
  - Use this to pass a shadow DOM target to the devtools so that the styles will be applied within the shadow DOM instead of within the head tag in the light DOM.
- `hideDisabledQueries?: boolean`
  - Defaults to `false`.
  - Set this to true to hide disabled queries from the devtools panel.
  - Read once, when the devtools mount. The devtools package has no setter for it, so a change after mount does not reach the open panel. The devtools Settings menu has its own "Disabled Queries" choice, which it saves in `localStorage` and prefers over this input.
- `theme?: "light" | "dark" | "system"`
  - Defaults to `system`.
  - Set this to change the theme of the devtools panel. The tags always pass a theme to the devtools, so the theme selected in the devtools Settings menu does not apply.

## Devtools in production

The tags above load nothing outside development. To show the devtools in a production build, import the tags from the `/production` entry of the package. They take the same inputs and load the devtools in every build:

```marko
import QueryDevtools from "@tanstack/marko-query-devtools/production/query-devtools.marko";

<QueryDevtools/>
```

```marko
import QueryDevtoolsPanel from "@tanstack/marko-query-devtools/production/query-devtools-panel.marko";

<QueryDevtoolsPanel/>
```

The devtools still load lazily: the browser downloads them after the tag mounts.

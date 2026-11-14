# @tanstack/marko-query-devtools

Devtools for [`@tanstack/marko-query`](../marko-query), built on
`@tanstack/query-devtools`.

This package is experimental, same as `@tanstack/marko-query`. Pin an exact
version if you use it in production while the API is early.

## Install

```sh
npm install @tanstack/marko-query-devtools
```

## Usage

Place the tag once, for example in the root layout:

```marko
<query-devtools/>
```

The tag renders nothing unless
`process.env.NODE_ENV === "development"`. It loads the devtools lazily in the
browser. To show the devtools in production builds, import the tag from
`/production`:

```marko
import QueryDevtools from "@tanstack/marko-query-devtools/production/query-devtools.marko";

<QueryDevtools/>
```

## Options

`<query-devtools>` shows a floating button that opens the panel.

| Input                 | Description                                                                     |
| --------------------- | ------------------------------------------------------------------------------- |
| `initialIsOpen`       | Open the panel on first render. Defaults to `false`.                            |
| `buttonPosition`      | `top-left`, `top-right`, `bottom-left`, `bottom-right` (default) or `relative`. |
| `position`            | `top`, `bottom` (default), `left` or `right`.                                   |
| `client`              | `() => client`, to inspect another client than the one for this `$global`.      |
| `errorTypes`          | `() => errors`, the errors that can be triggered from the devtools.             |
| `styleNonce`          | Nonce for the style tag added to the document head (CSP).                       |
| `shadowDOMTarget`     | `() => shadowRoot`, to put the styles in a shadow root.                         |
| `hideDisabledQueries` | Hide disabled queries.                                                          |
| `theme`               | `light`, `dark` or `system` (default).                                          |

`<query-devtools-panel>` renders the panel inline. It takes the same inputs,
except `initialIsOpen`, `buttonPosition` and `position`. It also takes `style`
(defaults to `height: 500px`) and `onClose`.

```marko
<let/open=true>
<if=open>
  <query-devtools-panel style={ height: "100%" } onClose() { open = false; }/>
</if>
```

---
id: DevtoolsOptions
title: DevtoolsOptions
---

# Interface: DevtoolsOptions

Options for configuring the TanStack Query devtools.

## Properties

### buttonPosition?

```ts
optional buttonPosition: DevtoolsButtonPosition;
```

The position of the TanStack logo to open and close the devtools panel.
`top-left` | `top-right` | `bottom-left` | `bottom-right` | `relative`
Defaults to `bottom-right`.

#### Defined in

[providers.ts:192](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/providers.ts#L192)

---

### client?

```ts
optional client: QueryClient;
```

Custom instance of QueryClient

#### Defined in

[providers.ts:202](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/providers.ts#L202)

---

### errorTypes?

```ts
optional errorTypes: DevtoolsErrorType[];
```

Use this so you can define custom errors that can be shown in the devtools.

#### Defined in

[providers.ts:206](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/providers.ts#L206)

---

### initialIsOpen?

```ts
optional initialIsOpen: boolean;
```

Set this true if you want the devtools to default to being open

#### Defined in

[providers.ts:186](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/providers.ts#L186)

---

### loadDevtools?

```ts
optional loadDevtools: boolean | "auto";
```

Whether the developer tools should load.

- `auto`- (Default) Lazily loads devtools when in development mode. Skips loading in production mode.
- `true`- Always load the devtools, regardless of the environment.
- `false`- Never load the devtools, regardless of the environment.

You can use `true` and `false` to override loading developer tools from an environment file.
For example, a test environment might run in production mode but you may want to load developer tools.

Additionally, you can use a signal in the callback to dynamically load the devtools based on a condition. For example,
a signal created from a RxJS observable that listens for a keyboard shortcut.

**Example**

```ts
withDevtools(() => ({
  initialIsOpen: true,
  loadDevtools: inject(ExampleService).loadDevtools(),
}))
```

#### Defined in

[providers.ts:236](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/providers.ts#L236)

---

### position?

```ts
optional position: DevtoolsPosition;
```

The position of the TanStack Query devtools panel.
`top` | `bottom` | `left` | `right`
Defaults to `bottom`.

#### Defined in

[providers.ts:198](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/providers.ts#L198)

---

### shadowDOMTarget?

```ts
optional shadowDOMTarget: ShadowRoot;
```

Use this so you can attach the devtool's styles to a specific element in the DOM.

#### Defined in

[providers.ts:214](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/providers.ts#L214)

---

### styleNonce?

```ts
optional styleNonce: string;
```

Use this to pass a nonce to the style tag that is added to the document head. This is useful if you are using a Content Security Policy (CSP) nonce to allow inline styles.

#### Defined in

[providers.ts:210](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/providers.ts#L210)

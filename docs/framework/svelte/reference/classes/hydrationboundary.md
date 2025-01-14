---
id: HydrationBoundary
title: HydrationBoundary
---

# Class: HydrationBoundary\<Props, Events, Slots\>

Base class for Svelte components with some minor dev-enhancements. Used when dev=true.

Can be used to create strongly typed Svelte components.

#### Example:

You have component library on npm called `component-library`, from which
you export a component called `MyComponent`. For Svelte+TypeScript users,
you want to provide typings. Therefore you create a `index.d.ts`:

```ts
import { SvelteComponent } from 'svelte'
export class MyComponent extends SvelteComponent<{ foo: string }> {}
```

Typing this makes it possible for IDEs like VS Code with the Svelte extension
to provide intellisense and to use the component like this in a Svelte file
with TypeScript:

```svelte
<script lang="ts">
  import { MyComponent } from 'component-library'
</script>

<MyComponent foo={'bar'} />
```

## Extends

- `SvelteComponent_1`\<`Props`, `Events`\>

## Type Parameters

• **Props** _extends_ `Record`\<`string`, `any`\> = `any`

• **Events** _extends_ `Record`\<`string`, `any`\> = `any`

• **Slots** _extends_ `Record`\<`string`, `any`\> = `any`

## Indexable

\[`prop`: `string`\]: `any`

## Constructors

### new HydrationBoundary()

```ts
new HydrationBoundary<Props, Events, Slots>(options): HydrationBoundary<Props, Events, Slots>
```

#### Parameters

##### options

`ComponentConstructorOptions`\<`Props`\>

#### Returns

[`HydrationBoundary`](hydrationboundary.md)\<`Props`, `Events`, `Slots`\>

#### Overrides

`SvelteComponent_1<Props, Events>.constructor`

#### Defined in

node_modules/.pnpm/svelte@4.2.19/node_modules/svelte/types/index.d.ts:144

## Properties

### $$

```ts
$$: any
```

### PRIVATE API

Do not use, may change at any time

#### Inherited from

`SvelteComponent_1.$$`

#### Defined in

node_modules/.pnpm/svelte@4.2.19/node_modules/svelte/types/index.d.ts:102

---

### $$events_def

```ts
$$events_def: Events
```

For type checking capabilities only.
Does not exist at runtime.

### DO NOT USE!

#### Defined in

node_modules/.pnpm/svelte@4.2.19/node_modules/svelte/types/index.d.ts:158

---

### $$prop_def

```ts
$$prop_def: Props
```

For type checking capabilities only.
Does not exist at runtime.

### DO NOT USE!

#### Defined in

node_modules/.pnpm/svelte@4.2.19/node_modules/svelte/types/index.d.ts:151

---

### $$set

```ts
$$set: any
```

### PRIVATE API

Do not use, may change at any time

#### Inherited from

`SvelteComponent_1.$$set`

#### Defined in

node_modules/.pnpm/svelte@4.2.19/node_modules/svelte/types/index.d.ts:109

---

### $$slot_def

```ts
$$slot_def: Slots
```

For type checking capabilities only.
Does not exist at runtime.

### DO NOT USE!

#### Defined in

node_modules/.pnpm/svelte@4.2.19/node_modules/svelte/types/index.d.ts:165

## Methods

### $capture_state()

```ts
$capture_state(): void
```

#### Returns

`void`

#### Defined in

node_modules/.pnpm/svelte@4.2.19/node_modules/svelte/types/index.d.ts:167

---

### $destroy()

```ts
$destroy(): void
```

#### Returns

`void`

#### Inherited from

`SvelteComponent_1.$destroy`

#### Defined in

node_modules/.pnpm/svelte@4.2.19/node_modules/svelte/types/index.d.ts:111

---

### $inject_state()

```ts
$inject_state(): void
```

#### Returns

`void`

#### Defined in

node_modules/.pnpm/svelte@4.2.19/node_modules/svelte/types/index.d.ts:169

---

### $on()

```ts
$on<K>(type, callback): () => void
```

#### Type Parameters

• **K** _extends_ `string`

#### Parameters

##### type

`K`

##### callback

`undefined` | `null` | (`e`) => `void`

#### Returns

`Function`

##### Returns

`void`

#### Inherited from

`SvelteComponent_1.$on`

#### Defined in

node_modules/.pnpm/svelte@4.2.19/node_modules/svelte/types/index.d.ts:113

---

### $set()

```ts
$set(props): void
```

#### Parameters

##### props

`Partial`\<`Props`\>

#### Returns

`void`

#### Inherited from

`SvelteComponent_1.$set`

#### Defined in

node_modules/.pnpm/svelte@4.2.19/node_modules/svelte/types/index.d.ts:115

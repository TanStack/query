---
id: installation
title: Installation
---

You can install Vue Query via [NPM](https://npmjs.com).

### NPM

```sh
npm i @tanstack/vue-query
```

or

```sh
pnpm add @tanstack/vue-query
```

or

```sh
yarn add @tanstack/vue-query
```

or

```sh
bun add @tanstack/vue-query
```

Vue Query is compatible with Vue 3.3 and later versions.

> Wanna give it a spin before you download? Try out the [basic](./examples/basic) example!

### Vue Query Initialization

Before using Vue Query, you need to initialize it using `VueQueryPlugin`

```tsx
import { VueQueryPlugin } from '@tanstack/vue-query'

app.use(VueQueryPlugin)
```

### Use of Composition API with `<script setup>`

All examples in our documentation use [`<script setup>`](https://vuejs.org/api/sfc-script-setup.html) syntax.

If you are not a fan of `<script setup>` syntax, you can easily translate all the examples into normal Composition API syntax by moving the code under `setup()` function and returning the values used in the template.

```vue
<script setup>
import { useQuery } from '@tanstack/vue-query'

const { isPending, isFetching, isError, data, error } = useQuery({
  queryKey: ['todos'],
  queryFn: getTodos,
})
</script>

<template>...</template>
```

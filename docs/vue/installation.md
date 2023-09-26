---
id: installation
title: Installation
---

You can install Vue Query via [NPM](https://npmjs.com).

> v5 is currently available as a release-candidate. We don't anticipate any major API changes from here on out. We encourage you to try it out and report any issues you find.

### NPM

```bash
$ npm i @tanstack/vue-query@rc
# or
$ pnpm add @tanstack/vue-query@rc
# or
$ yarn add @tanstack/vue-query@rc
```

> Wanna give it a spin before you download? Try out the [basic](../examples/vue/basic) example!

Vue Query is compatible with Vue 2.x and 3.x

> If you are using Vue 2.6, make sure to also setup [@vue/composition-api](https://github.com/vuejs/composition-api)

### Vue Query Initialization

Before using Vue Query, you need to initialize it using `VueQueryPlugin`

```tsx
import { VueQueryPlugin } from "@tanstack/vue-query";

app.use(VueQueryPlugin)
```

### Use of Composition API with `<script setup>`

All examples in our documentation use [`<script setup>`](https://staging.vuejs.org/api/sfc-script-setup.html) syntax.

Vue 2 users can also use that syntax using [this plugin](https://github.com/antfu/unplugin-vue2-script-setup). Please check the plugin documentation for installation details.

If you are not a fan of `<script setup>` syntax, you can easily translate all the examples into normal Composition API syntax by moving the code under `setup()` function and returning the values used in the template.

```vue
<script setup>
import { useQuery } from "@tanstack/vue-query";

const { isPending, isFetching, isError, data, error } = useQuery({
  queryKey: ['todos'],
  queryFn: getTodos,
})
</script>

<template>...</template>
```

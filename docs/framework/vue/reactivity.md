---
id: reactivity
title: Reactivity
---

Vue uses the [the signals paradigm](https://vuejs.org/guide/extras/reactivity-in-depth.html#connection-to-signals) to handle and track reactivity. A key feature of
this system is the reactive system only triggers updates on specifically watched reactive properties. A consequence of this is you also need to ensure that the queries are updated when values they consume are updated.

# Keeping Queries Reactive

When creating a composable for a query your first choice may be to write it like so:

```ts
export function useUserProjects(userId: string) {
  return useQuery(
    queryKey: ['userProjects', userId],
    queryFn: () => api.fetchUserProjects(userId),
  );
}
```

We might consume this composable like so:

```ts
// Reactive user ID ref.
const userId = ref('1')
// Fetches the user 1's projects.
const { data: projects } = useUserProjects(userId.value)

const onChangeUser = (newUserId: string) => {
  // Edits the userId, but the query will not re-fetch.
  userId.value = newUserId
}
```

This code will not work as intended. This is because we are extracting the value from the userId ref directly. Vue-query is not tracking the `userId` `ref` so it has no way of knowing when the value changes.

Luckily, the fix for this is trivial. The value must be made trackable in the query key. We can Just accept the `ref` directly in the composable and place it in the query key:

```ts
export function useUserProjects(userId: Ref<string>) {
  return useQuery(
    queryKey: ['userProjects', userId],
    queryFn: () => api.fetchUserProjects(userId.value),
  );
}
```

Now the query will re-fetch when the `userId` changes.

```ts
const onChangeUser = (newUserId: string) => {
  // Query refetches data with new user ID!
  userId.value = newUserId
}
```

In vue query any reactive properties within a query key are tracked for changes automatically. This allows vue-query to refetch data whenever the
parameters for a given request change.

## Accounting for Non-Reactive Queries

While far less likely, sometimes passing non-reactive variables is intentional. For example, some entities only need to be fetched once and don't need tracking or we invalidate a mutation a query options object after a mutation.
If we use our custom composable defined above the usage in this case feels a bit off:

```ts
const { data: projects } = useUserProjects(ref('1'))
```

We have to create an intermediate `ref` just to make the parameter type-compatible. We can do better here. Let's instead update our composable to accept both plain values and reactive values:

```ts
export function useUserProjects(userId: MaybeRef<string>) {
  return useQuery(
    queryKey: ['userProjects', userId],
    queryFn: () => api.fetchUserProjects(toValue(userId)),
  );
}
```

Now we can use the composable with both plain values and refs:

```ts
// Fetches the user 1's projects, userId is not expected to change.
const { data: projects } = useUserProjects('1')

// Fetches the user 1's projects, queries will react to changes on userId.
const userId = ref('1')

// Make some changes to userId...

// Query re-fetches based on any changes to userId.
const { data: projects } = useUserProjects(userId)
```

## Using Derived State inside Queries

It's quite common to derive some new reactive state from another source of reactive state. Commonly, this problem manifests in situations where you deal with component props. Let's assume our `userId` is a prop passed to a component:

```vue
<script setup lang="ts">
const props = defineProps<{
  userId: string
}>()
</script>
```

You may be tempted to use the prop directly in the query like so:

```ts
// Won't react to changes in props.userId.
const { data: projects } = useUserProjects(props.userId)
```

However, similar to the first example, this is not reactive. Property access on `reactive` variables causes reactivity to be lost. We can fix this by making this derived state reactive via a `computed`:

```ts
const userId = computed(() => props.userId)

// Reacts to changes in props.userId.
const { data: projects } = useUserProjects(userId)
```

This works as expected, however, this solution isn't always the most optimal. Aside from the introduction of an intermediate variable, we also create a memoized value that is somewhat unnecessary. For trivial cases of simple property access `computed` is an optimization with no real benefit. In these cases a more appropriate solution is to use [reactive getters](https://blog.vuejs.org/posts/vue-3-3#better-getter-support-with-toref-and-tovalue). Reactive getters are simply functions that return a value based on some reactive state, similar to how `computed` works. Unlike `computed`, reactive getters do not memoize their values so it makes it a good candidate for simple property access.

Let's once again refactor our composable, but this time we'll have it accept a `ref`, plain value, or a reactive getter:

```ts
export function useUserProjects(userId: MaybeRefOrGetter<string>) {
  ...
}
```

Let's adjust our usage and now use a reactive getter:

```ts
// Reacts to changes in props.userId. No `computed` needed!
const { data: projects } = useUserProjects(() => props.userId)
```

This gives us a terse syntax and the reactivity we need without any unneeded memoization overhead.

## Other tracked Query Options

Above, we only touched one query option that tracks reactive dependencies. However, in addition to `queryKey`, `enabled` also allows
the use of reactive values. This comes in handy in situations where you want to control the fetching of a query based on some derived state:

```ts
export function useUserProjects(userId: MaybeRef<string>) {
  return useQuery(
    queryKey: ['userProjects', userId],
    queryFn: () => api.fetchUserProjects(toValue(userId)),
    enabled: () => userId.value === activeUserId.value,
  );
}
```

More details on this option can be found on the [useQuery reference](./reference/useQuery.md) page.

## Immutability

Results from `useQuery` are always immutable. This is necessary for performance and caching purposes. If you need to mutate a value returned from `useQuery`, you must create a copy of the data.

One implication of this design is that passing values from `useQuery` to a two-way binding such as `v-model` will not work. You must create a mutable copy of the data before attempting to update it in place.

# Key Takeaways

- `enabled` and `queryKey` are the two query options that can accept reactive values.
- Pass query option that accept all three types of values in Vue: refs, plain values, and reactive getters.
- If you expect a query to react to changes based on the values it consumes, ensure that the values are reactive. (i.e. pass in refs directly to the query, or use reactive getters)
- If you don't need a query to be reactive pass in a plain value.
- For trivial derived state such as property access consider using a reactive getter in place of a `computed`.
- Results from `useQuery` are always immutable.

---
id: injectQuery
title: injectQuery
---

# Function: injectQuery()

Injects a query: a declarative dependency on an asynchronous source of data that is tied to a unique key.

**Basic example**

```ts
class ServiceOrComponent {
  query = injectQuery(() => ({
    queryKey: ['repoData'],
    queryFn: () =>
      this.#http.get<Response>('https://api.github.com/repos/tanstack/query'),
  }))
}
```

Similar to `computed` from Angular, the function passed to `injectQuery` will be run in the reactive context.
In the example below, the query will be automatically enabled and executed when the filter signal changes
to a truthy value. When the filter signal changes back to a falsy value, the query will be disabled.

**Reactive example**

```ts
class ServiceOrComponent {
  filter = signal('')

  todosQuery = injectQuery(() => ({
    queryKey: ['todos', this.filter()],
    queryFn: () => fetchTodos(this.filter()),
    // Signals can be combined with expressions
    enabled: !!this.filter(),
  }))
}
```

## Param

A function that returns query options.

## Param

The Angular injector to use.

## See

https://tanstack.com/query/latest/docs/framework/angular/guides/queries

## injectQuery(optionsFn, injector)

```ts
function injectQuery<TQueryFnData, TError, TData, TQueryKey>(
  optionsFn,
  injector?,
): DefinedCreateQueryResult<TData, TError>
```

Injects a query: a declarative dependency on an asynchronous source of data that is tied to a unique key.

**Basic example**

```ts
class ServiceOrComponent {
  query = injectQuery(() => ({
    queryKey: ['repoData'],
    queryFn: () =>
      this.#http.get<Response>('https://api.github.com/repos/tanstack/query'),
  }))
}
```

Similar to `computed` from Angular, the function passed to `injectQuery` will be run in the reactive context.
In the example below, the query will be automatically enabled and executed when the filter signal changes
to a truthy value. When the filter signal changes back to a falsy value, the query will be disabled.

**Reactive example**

```ts
class ServiceOrComponent {
  filter = signal('')

  todosQuery = injectQuery(() => ({
    queryKey: ['todos', this.filter()],
    queryFn: () => fetchTodos(this.filter()),
    // Signals can be combined with expressions
    enabled: !!this.filter(),
  }))
}
```

### Type Parameters

• **TQueryFnData** = `unknown`

• **TError** = `Error`

• **TData** = `TQueryFnData`

• **TQueryKey** _extends_ `QueryKey` = `QueryKey`

### Parameters

• **optionsFn**

A function that returns query options.

• **injector?**: `Injector`

The Angular injector to use.

### Returns

[`DefinedCreateQueryResult`](DefinedCreateQueryResult.md)\<`TData`, `TError`\>

The query result.

### See

https://tanstack.com/query/latest/docs/framework/angular/guides/queries

### Defined in

[inject-query.ts:53](https://github.com/TanStack/query/blob/27861961bbb36e9bc25fcd45cff21b5645f02f9b/packages/angular-query-experimental/src/inject-query.ts#L53)

## injectQuery(optionsFn, injector)

```ts
function injectQuery<TQueryFnData, TError, TData, TQueryKey>(
  optionsFn,
  injector?,
): CreateQueryResult<TData, TError>
```

Injects a query: a declarative dependency on an asynchronous source of data that is tied to a unique key.

**Basic example**

```ts
class ServiceOrComponent {
  query = injectQuery(() => ({
    queryKey: ['repoData'],
    queryFn: () =>
      this.#http.get<Response>('https://api.github.com/repos/tanstack/query'),
  }))
}
```

Similar to `computed` from Angular, the function passed to `injectQuery` will be run in the reactive context.
In the example below, the query will be automatically enabled and executed when the filter signal changes
to a truthy value. When the filter signal changes back to a falsy value, the query will be disabled.

**Reactive example**

```ts
class ServiceOrComponent {
  filter = signal('')

  todosQuery = injectQuery(() => ({
    queryKey: ['todos', this.filter()],
    queryFn: () => fetchTodos(this.filter()),
    // Signals can be combined with expressions
    enabled: !!this.filter(),
  }))
}
```

### Type Parameters

• **TQueryFnData** = `unknown`

• **TError** = `Error`

• **TData** = `TQueryFnData`

• **TQueryKey** _extends_ `QueryKey` = `QueryKey`

### Parameters

• **optionsFn**

A function that returns query options.

• **injector?**: `Injector`

The Angular injector to use.

### Returns

[`CreateQueryResult`](CreateQueryResult.md)\<`TData`, `TError`\>

The query result.

### See

https://tanstack.com/query/latest/docs/framework/angular/guides/queries

### Defined in

[inject-query.ts:102](https://github.com/TanStack/query/blob/27861961bbb36e9bc25fcd45cff21b5645f02f9b/packages/angular-query-experimental/src/inject-query.ts#L102)

## injectQuery(optionsFn, injector)

```ts
function injectQuery<TQueryFnData, TError, TData, TQueryKey>(
  optionsFn,
  injector?,
): CreateQueryResult<TData, TError>
```

Injects a query: a declarative dependency on an asynchronous source of data that is tied to a unique key.

**Basic example**

```ts
class ServiceOrComponent {
  query = injectQuery(() => ({
    queryKey: ['repoData'],
    queryFn: () =>
      this.#http.get<Response>('https://api.github.com/repos/tanstack/query'),
  }))
}
```

Similar to `computed` from Angular, the function passed to `injectQuery` will be run in the reactive context.
In the example below, the query will be automatically enabled and executed when the filter signal changes
to a truthy value. When the filter signal changes back to a falsy value, the query will be disabled.

**Reactive example**

```ts
class ServiceOrComponent {
  filter = signal('')

  todosQuery = injectQuery(() => ({
    queryKey: ['todos', this.filter()],
    queryFn: () => fetchTodos(this.filter()),
    // Signals can be combined with expressions
    enabled: !!this.filter(),
  }))
}
```

### Type Parameters

• **TQueryFnData** = `unknown`

• **TError** = `Error`

• **TData** = `TQueryFnData`

• **TQueryKey** _extends_ `QueryKey` = `QueryKey`

### Parameters

• **optionsFn**

A function that returns query options.

• **injector?**: `Injector`

The Angular injector to use.

### Returns

[`CreateQueryResult`](CreateQueryResult.md)\<`TData`, `TError`\>

The query result.

### See

https://tanstack.com/query/latest/docs/framework/angular/guides/queries

### Defined in

[inject-query.ts:151](https://github.com/TanStack/query/blob/27861961bbb36e9bc25fcd45cff21b5645f02f9b/packages/angular-query-experimental/src/inject-query.ts#L151)

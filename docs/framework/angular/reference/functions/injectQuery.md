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

Additional configuration

## See

https://tanstack.com/query/latest/docs/framework/angular/guides/queries

## Call Signature

```ts
function injectQuery<TQueryFnData, TError, TData, TQueryKey>(injectQueryFn, options?): DefinedCreateQueryResult<TData, TError>;
```

Defined in: [inject-query.ts:65](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-query.ts#L65)

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

#### TQueryFnData

`TQueryFnData` = `unknown`

#### TError

`TError` = `Error`

#### TData

`TData` = `TQueryFnData`

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

### Parameters

#### injectQueryFn

() => [`DefinedInitialDataOptions`](../type-aliases/DefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

A function that returns query options.

#### options?

[`InjectQueryOptions`](../interfaces/InjectQueryOptions.md)

Additional configuration

### Returns

[`DefinedCreateQueryResult`](../type-aliases/DefinedCreateQueryResult.md)\<`TData`, `TError`\>

The query result.

### See

https://tanstack.com/query/latest/docs/framework/angular/guides/queries

## Call Signature

```ts
function injectQuery<TQueryFnData, TError, TData, TQueryKey>(injectQueryFn, options?): CreateQueryResult<TData, TError>;
```

Defined in: [inject-query.ts:116](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-query.ts#L116)

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

#### TQueryFnData

`TQueryFnData` = `unknown`

#### TError

`TError` = `Error`

#### TData

`TData` = `TQueryFnData`

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

### Parameters

#### injectQueryFn

() => [`UndefinedInitialDataOptions`](../type-aliases/UndefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

A function that returns query options.

#### options?

[`InjectQueryOptions`](../interfaces/InjectQueryOptions.md)

Additional configuration

### Returns

[`CreateQueryResult`](../type-aliases/CreateQueryResult.md)\<`TData`, `TError`\>

The query result.

### See

https://tanstack.com/query/latest/docs/framework/angular/guides/queries

## Call Signature

```ts
function injectQuery<TQueryFnData, TError, TData, TQueryKey>(injectQueryFn, options?): CreateQueryResult<TData, TError>;
```

Defined in: [inject-query.ts:167](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-query.ts#L167)

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

#### TQueryFnData

`TQueryFnData` = `unknown`

#### TError

`TError` = `Error`

#### TData

`TData` = `TQueryFnData`

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

### Parameters

#### injectQueryFn

() => [`CreateQueryOptions`](../interfaces/CreateQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

A function that returns query options.

#### options?

[`InjectQueryOptions`](../interfaces/InjectQueryOptions.md)

Additional configuration

### Returns

[`CreateQueryResult`](../type-aliases/CreateQueryResult.md)\<`TData`, `TError`\>

The query result.

### See

https://tanstack.com/query/latest/docs/framework/angular/guides/queries

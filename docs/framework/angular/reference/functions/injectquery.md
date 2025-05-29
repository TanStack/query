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
function injectQuery<TQueryFnData, TError, TData, TQueryKey>(
  injectQueryFn,
  options?,
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

• **TQueryKey** _extends_ readonly `unknown`[] = readonly `unknown`[]

### Parameters

#### injectQueryFn

() => [`DefinedInitialDataOptions`](../../type-aliases/definedinitialdataoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

A function that returns query options.

#### options?

[`InjectQueryOptions`](../../interfaces/injectqueryoptions.md)

Additional configuration

### Returns

[`DefinedCreateQueryResult`](../../type-aliases/definedcreatequeryresult.md)\<`TData`, `TError`\>

The query result.

The query result.

### Param

A function that returns query options.

### Param

Additional configuration

### See

https://tanstack.com/query/latest/docs/framework/angular/guides/queries

### See

https://tanstack.com/query/latest/docs/framework/angular/guides/queries

### Defined in

[inject-query.ts:66](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-query.ts#L66)

## Call Signature

```ts
function injectQuery<TQueryFnData, TError, TData, TQueryKey>(
  injectQueryFn,
  options?,
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

• **TQueryKey** _extends_ readonly `unknown`[] = readonly `unknown`[]

### Parameters

#### injectQueryFn

() => [`UndefinedInitialDataOptions`](../../type-aliases/undefinedinitialdataoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

A function that returns query options.

#### options?

[`InjectQueryOptions`](../../interfaces/injectqueryoptions.md)

Additional configuration

### Returns

[`CreateQueryResult`](../../type-aliases/createqueryresult.md)\<`TData`, `TError`\>

The query result.

The query result.

### Param

A function that returns query options.

### Param

Additional configuration

### See

https://tanstack.com/query/latest/docs/framework/angular/guides/queries

### See

https://tanstack.com/query/latest/docs/framework/angular/guides/queries

### Defined in

[inject-query.ts:118](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-query.ts#L118)

## Call Signature

```ts
function injectQuery<TQueryFnData, TError, TData, TQueryKey>(
  injectQueryFn,
  options?,
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

• **TQueryKey** _extends_ readonly `unknown`[] = readonly `unknown`[]

### Parameters

#### injectQueryFn

() => [`CreateQueryOptions`](../../interfaces/createqueryoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

A function that returns query options.

#### options?

[`InjectQueryOptions`](../../interfaces/injectqueryoptions.md)

Additional configuration

### Returns

[`CreateQueryResult`](../../type-aliases/createqueryresult.md)\<`TData`, `TError`\>

The query result.

The query result.

### Param

A function that returns query options.

### Param

Additional configuration

### See

https://tanstack.com/query/latest/docs/framework/angular/guides/queries

### See

https://tanstack.com/query/latest/docs/framework/angular/guides/queries

### Defined in

[inject-query.ts:170](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-query.ts#L170)

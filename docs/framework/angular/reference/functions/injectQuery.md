---
id: injectQuery
title: injectQuery
---

# Function: injectQuery()

Injects a query: a declarative dependency on an asynchronous source of data that is tied to a unique key.

**Basic example**
```ts
import { lastValueFrom } from 'rxjs'

class ServiceOrComponent {
  query = injectQuery(() => ({
    queryKey: ['repoData'],
    queryFn: () =>
      lastValueFrom(
        this.#http.get<Response>('https://api.github.com/repos/tanstack/query'),
      ),
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

## See

https://tanstack.com/query/latest/docs/framework/angular/guides/queries

## Call Signature

```ts
function injectQuery<TQueryFnData, TError, TData, TQueryKey>(optionsFn): DefinedCreateQueryResult<TData, TError>;
```

Defined in: [packages/angular-query/src/inject-query.ts:17](https://github.com/TanStack/query/blob/main/packages/angular-query/src/inject-query.ts#L17)

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

#### optionsFn

() => [`DefinedInitialDataOptions`](../type-aliases/DefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

### Returns

[`DefinedCreateQueryResult`](../type-aliases/DefinedCreateQueryResult.md)\<`TData`, `TError`\>

## Call Signature

```ts
function injectQuery<TQueryFnData, TError, TData, TQueryKey>(optionsFn): CreateQueryResult<TData, TError>;
```

Defined in: [packages/angular-query/src/inject-query.ts:31](https://github.com/TanStack/query/blob/main/packages/angular-query/src/inject-query.ts#L31)

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

#### optionsFn

() => [`UndefinedInitialDataOptions`](../type-aliases/UndefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

### Returns

[`CreateQueryResult`](../type-aliases/CreateQueryResult.md)\<`TData`, `TError`\>

## Call Signature

```ts
function injectQuery<TQueryFnData, TError, TData, TQueryKey>(optionsFn): CreateQueryResult<TData, TError>;
```

Defined in: [packages/angular-query/src/inject-query.ts:45](https://github.com/TanStack/query/blob/main/packages/angular-query/src/inject-query.ts#L45)

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

#### optionsFn

() => [`CreateQueryOptions`](../type-aliases/CreateQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

### Returns

[`CreateQueryResult`](../type-aliases/CreateQueryResult.md)\<`TData`, `TError`\>

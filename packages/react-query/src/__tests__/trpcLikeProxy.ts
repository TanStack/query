import {
  experimental_fromHandle,
  experimental_queryHandle,
  experimental_queryHandleAsync,
  infiniteQueryOptions,
  queryOptions,
} from '..'
import type {
  QueryClient,
  StaleTime,
  experimental_FromHandleOptions,
  experimental_QueryHandle,
  experimental_QueryHandleCallOptions,
  experimental_QueryHandleFactory,
} from '..'

// A small tRPC-like options proxy that uses only the public handle APIs

type AnyProcedure = (input: any) => Promise<unknown>

export type AnyRouter = Record<string, AnyProcedure>

type InputOf<TProcedure extends AnyProcedure> = Parameters<TProcedure>[0]
type OutputOf<TProcedure extends AnyProcedure> = Awaited<ReturnType<TProcedure>>

type Cursor = number | null

const procedureQueryOptions = <TPath extends string, TInput, TOutput>(
  path: TPath,
  call: (input: TInput) => Promise<TOutput>,
  input: TInput,
) =>
  queryOptions({
    queryKey: [path, { input, type: 'query' }] as const,
    queryFn: () => call(input),
  })

const procedureInfiniteQueryOptions = <
  TPath extends string,
  TInput extends { cursor?: Cursor },
  TOutput extends { nextCursor: Cursor },
>(
  path: TPath,
  call: (input: TInput) => Promise<TOutput>,
  input: Omit<TInput, 'cursor'>,
) =>
  infiniteQueryOptions({
    queryKey: [path, { input, type: 'infinite' }] as const,
    queryFn: ({ pageParam }) => call({ ...input, cursor: pageParam } as TInput),
    initialPageParam: null as Cursor,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })

type ProcedureQueryOptions<
  TPath extends string,
  TProcedure extends AnyProcedure,
> = (
  input: InputOf<TProcedure>,
) => ReturnType<
  typeof procedureQueryOptions<TPath, InputOf<TProcedure>, OutputOf<TProcedure>>
>

type ProcedureInfiniteQueryOptions<
  TPath extends string,
  TInput extends { cursor?: Cursor },
  TOutput extends { nextCursor: Cursor },
> = (
  input: Omit<TInput, 'cursor'>,
) => ReturnType<typeof procedureInfiniteQueryOptions<TPath, TInput, TOutput>>

type DecorateInfiniteProcedure<
  TPath extends string,
  TProcedure extends AnyProcedure,
> = TProcedure extends (
  input: infer TInput extends { cursor?: Cursor },
) => Promise<infer TOutput extends { nextCursor: Cursor }>
  ? {
      infiniteQueryOptions: ProcedureInfiniteQueryOptions<
        TPath,
        TInput,
        TOutput
      >
      $infiniteQueryHandleAsync: (
        input: Omit<TInput, 'cursor'>,
        opts?: { pages?: number } & experimental_QueryHandleCallOptions<
          ProcedureInfiniteQueryOptions<TPath, TInput, TOutput>
        >,
      ) => Promise<
        experimental_QueryHandle<
          ProcedureInfiniteQueryOptions<TPath, TInput, TOutput>
        >
      >
    }
  : {}

type DecorateProcedure<
  TPath extends string,
  TProcedure extends AnyProcedure,
> = {
  queryOptions: ProcedureQueryOptions<TPath, TProcedure>
  $queryHandle: (
    input: InputOf<TProcedure>,
    callOptions?: experimental_QueryHandleCallOptions<
      ProcedureQueryOptions<TPath, TProcedure>
    >,
  ) => experimental_QueryHandle<ProcedureQueryOptions<TPath, TProcedure>>
  $queryHandleAsync: (
    input: InputOf<TProcedure>,
    callOptions?: experimental_QueryHandleCallOptions<
      ProcedureQueryOptions<TPath, TProcedure>
    >,
  ) => Promise<
    experimental_QueryHandle<ProcedureQueryOptions<TPath, TProcedure>>
  >
} & DecorateInfiniteProcedure<TPath, TProcedure>

type ProcedureFactory<TRouter extends AnyRouter> = {
  [TPath in keyof TRouter & string]:
    | ProcedureQueryOptions<TPath, TRouter[TPath]>
    | (DecorateInfiniteProcedure<TPath, TRouter[TPath]> extends {
        infiniteQueryOptions: infer TFactory
      }
        ? TFactory
        : never)
}[keyof TRouter & string]

type HandleOf<TFactory> = TFactory extends experimental_QueryHandleFactory
  ? experimental_QueryHandle<TFactory>
  : never

/**
 * Any handle a procedure of the router started.
 */
type AnyRouterHandle<TRouter extends AnyRouter> = HandleOf<
  ProcedureFactory<TRouter>
>

type FactoryOfHandle<TRouter extends AnyRouter, THandle> = THandle extends {
  queryKey: readonly [
    infer TPath extends keyof TRouter & string,
    { type: infer TType },
  ]
}
  ? TType extends 'infinite'
    ? DecorateInfiniteProcedure<TPath, TRouter[TPath]> extends {
        infiniteQueryOptions: infer TFactory
      }
      ? TFactory
      : never
    : ProcedureQueryOptions<TPath, TRouter[TPath]>
  : never

export type OptionsProxy<TRouter extends AnyRouter> = {
  [TPath in keyof TRouter & string]: DecorateProcedure<TPath, TRouter[TPath]>
} & {
  /**
   * Rebuilds the options of any handle the router's procedures started, from the procedure path
   * in its key.
   */
  $fromHandle: <THandle extends AnyRouterHandle<TRouter>>(
    handle: THandle,
  ) => FactoryOfHandle<TRouter, THandle> extends infer TFactory extends (
    input: any,
  ) => { queryKey: ReadonlyArray<unknown> }
    ? THandle extends experimental_QueryHandle<TFactory>
      ? experimental_FromHandleOptions<TFactory>
      : never
    : never
}

/**
 * Creates an options proxy whose procedures start queries and return handles.
 * @param router - The procedures, by path.
 * @param queryClient - The client to start queries on.
 * @returns The proxy.
 */
export function createOptionsProxy<TRouter extends AnyRouter>(
  router: TRouter,
  queryClient: QueryClient,
): OptionsProxy<TRouter> {
  const decorate = (path: string) => {
    const call = (input: unknown) => router[path]!(input)
    const factory = (input: unknown) => procedureQueryOptions(path, call, input)
    const infiniteFactory = (input: object) =>
      procedureInfiniteQueryOptions(
        path,
        call as (input: { cursor?: Cursor }) => Promise<{ nextCursor: Cursor }>,
        input,
      )
    return {
      queryOptions: factory,
      infiniteQueryOptions: infiniteFactory,
      $queryHandle: (
        input: unknown,
        callOptions?: experimental_QueryHandleCallOptions<typeof factory>,
      ) => experimental_queryHandle(queryClient, factory, input, callOptions),
      $queryHandleAsync: (
        input: unknown,
        callOptions?: experimental_QueryHandleCallOptions<typeof factory>,
      ) =>
        experimental_queryHandleAsync(queryClient, factory, input, callOptions),
      $infiniteQueryHandleAsync: (
        input: object,
        opts?: { pages?: number; staleTime?: StaleTime },
      ) =>
        experimental_queryHandleAsync(
          queryClient,
          (pageInput: object) => ({
            ...infiniteFactory(pageInput),
            pages: opts?.pages,
          }),
          input,
          { staleTime: opts?.staleTime },
        ),
    }
  }

  const $fromHandle = (handle: {
    queryKey: readonly [string, { type: 'query' | 'infinite' }]
    input: any
  }) => {
    const [path, { type }] = handle.queryKey
    const procedure = decorate(path)
    return type === 'infinite'
      ? experimental_fromHandle(procedure.infiniteQueryOptions, handle as never)
      : experimental_fromHandle(procedure.queryOptions, handle as never)
  }

  return new Proxy({} as OptionsProxy<TRouter>, {
    get: (_target, path) =>
      path === '$fromHandle' ? $fromHandle : decorate(path as string),
  })
}

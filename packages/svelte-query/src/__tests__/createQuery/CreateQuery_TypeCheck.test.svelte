<script lang="ts">
  import type { CreateQueryOptions} from "$lib";
  import {createQuery, QueryClient} from "$lib";
  import {setQueryClientContext} from "$lib/context";
  import {expectType} from "../utils";
  import type {QueryFunction, QueryKey} from "@tanstack/query-core";

  export let queryKey: Array<string> = ["test"];

  const queryClient = new QueryClient()
  setQueryClientContext(queryClient)

  // unspecified query function should default to unknown.
  export let noQueryFn = createQuery({
    queryKey
  });
  noQueryFn.subscribe(value => {
    expectType<unknown>(value.data);
    expectType<unknown>(value.error)
  });


  // it should infer the result type from the query function.
  export let queryWithFn = createQuery(queryKey, () => 'test');
  queryWithFn.subscribe(value => {
    expectType<string | undefined>(value.data)
    expectType<unknown>(value.error)
  });


  // it should be possible to specify the result type.
  export let queryWithResult = createQuery<string>(queryKey, () => 'test');
  queryWithResult.subscribe(value => {
    expectType<string | undefined>(value.data)
    expectType<unknown | null>(value.error)
  });


  // it should be possible to specify the result type.
  export let queryWithError = createQuery<string, Error>(queryKey, () => 'test');
  queryWithError.subscribe(value => {
    expectType<string | undefined>(value.data)
    expectType<Error | null>(value.error)
  });


  // it should be possible to specify the result type.
  createQuery<boolean, Error>(queryKey,
    async () => true,
    {
      onSuccess: (data) => expectType<boolean>(data),
      onSettled: (data) => expectType<boolean | undefined>(data)
    }
  );


  // it should be possible to specify a union type as result type.
  const unionTypeSync = createQuery(
    queryKey,
    () => (Math.random() > 0.5 ? 'a' : 'b'),
    {
      onSuccess: (data) => expectType<'a' | 'b'>(data),
    },
  )
  expectType<'a' | 'b' | undefined>($unionTypeSync.data)
  const unionTypeAsync = createQuery<'a' | 'b'>(
    queryKey,
    () => Math.random() > 0.5 ? 'a' : 'b',
    {
      onSuccess: (data) => expectType<'a' | 'b'>(data),
    },
  )
  expectType<'a' | 'b' | undefined>($unionTypeAsync.data)


  // should error when the query function result does not match with the specified type.
  // @ts-expect-error
  createQuery<number>(queryKey, () => 'test')

  // it should infer the result type from a generic query function
  // eslint-disable-next-line no-unused-vars
  function queryFn<T = string>(): Promise<T> {
    return Promise.resolve({} as T)
  }


  // it should infer query function return type from a generic query function.
  const fromGenericQueryFn = createQuery(queryKey, () => queryFn())
  expectType<string | undefined>($fromGenericQueryFn.data)
  expectType<unknown>($fromGenericQueryFn.error)


  // it should infer query function return type from a generic query function passed as options.
  const fromGenericOptionsQueryFn = createQuery({
    queryKey: queryKey,
    queryFn: () => queryFn(),
  })
  expectType<string | undefined>($fromGenericOptionsQueryFn.data)
  expectType<unknown>($fromGenericOptionsQueryFn.error)


  // it should accept generic query keys.
  type MyData = number
  type MyQueryKey = readonly ['my-data', number]
  const getMyDataArrayKey: QueryFunction<MyData, MyQueryKey> = async ({queryKey: [, n]}) => {
    return n + 42
  }

 createQuery({queryKey :  ['my-data', 100] as const, queryFn : getMyDataArrayKey});


  const getMyDataStringKey: QueryFunction<MyData, readonly ['1']> = async (
    context,
  ) => {
    expectType<readonly ['1']>(context.queryKey)
    return Number(context.queryKey[0]) + 42
  }


  // it should handle query-functions that return Promise<any>
  createQuery(queryKey, () =>
    fetch('return Promise<any>').then((resp) => resp.json()),
  )


  // handles wrapped queries with custom fetcher passed as inline queryFn
  const useWrappedQuery = <
    TQueryKey extends [string, Record<string, unknown>?],
    TQueryFnData,
    TError,
    TData = TQueryFnData,
  >(
    qk: TQueryKey,
    fetcher: (
      obj: TQueryKey[1],
      token: string,
      // return type must be wrapped with TQueryFnReturn
    ) => Promise<TQueryFnData>,
    options?: Omit<
      CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
      'queryKey' | 'queryFn' | 'initialData'
    >,
  ) => createQuery(qk, () => fetcher(qk[1], 'token'), options)
  const test = useWrappedQuery(
    [''],
    async () => '1',
  )
  expectType<string | undefined>($test.data)


  // handles wrapped queries with custom fetcher passed directly to createQuery
  const useWrappedFuncStyleQuery = <
    TQueryKey extends QueryKey,
    TQueryFnData,
    TError,
    TData = TQueryFnData,
  >(
    qk: TQueryKey,
    fetcher: () => Promise<TQueryFnData>,
    options?: (Omit<
    CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    'queryKey' | 'queryFn' | 'initialData'
  > & { initialData?: () => undefined }),
  ) => {
    return createQuery(qk, fetcher, options);
  }

  const testFuncStyle = useWrappedFuncStyleQuery(
    [''],
    async () => true,
  );

  expectType<boolean | undefined>($testFuncStyle.data);

</script>

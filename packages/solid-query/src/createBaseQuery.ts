import { QueryObserver } from '@tanstack/query-core'
import type { QueryKey, QueryObserverResult } from '@tanstack/query-core'
import {  CreateBaseQueryOptions } from './types'
import { useQueryClient } from "./QueryClientProvider";
import { onMount, onCleanup, createComputed, createResource, createEffect, batch } from 'solid-js';
import { createStore } from 'solid-js/store';

// Base Query Function that is used to create the query.
export function createBaseQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey
>(
  options: CreateBaseQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >,
  Observer: typeof QueryObserver
): QueryObserverResult<TData, TError> {

  const queryClient = useQueryClient();

  const defaultedOptions = queryClient.defaultQueryOptions(options)
  defaultedOptions._optimisticResults = 'optimistic';
  const observer = new QueryObserver(queryClient, defaultedOptions);

  const [state, setState] = createStore<QueryObserverResult<TData, TError>>(
    // @ts-ignore
    observer.getOptimisticResult(defaultedOptions),
  );

  const [ dataResource, { refetch } ] = createResource(() => {
    return new Promise((resolve, reject) => {
      if (state.isSuccess) resolve(state.data)
      if (state.isError && !state.isFetching) { 
        throw state.error
      }
    })
  });

  observer.updateResult();

  const unsubscribe = observer.subscribe((result) => {
    const reconciledResult = result;
    // @ts-ignore
    setState(reconciledResult);
    refetch();
  });

  onCleanup(() => unsubscribe());

  onMount(() => {
    observer.setOptions(defaultedOptions, { listeners: false });
  });

  createComputed(() => {
    const defaultedOptions = queryClient.defaultQueryOptions(options)
    observer.setOptions(defaultedOptions)
  })

  const handler = {
    get(target: QueryObserverResult<TData, TError>, prop: (keyof QueryObserverResult<TData, TError>)): any {
      if (prop === 'data') {
        return dataResource();
      }
      return Reflect.get(target, prop);
    }
  }

  return new Proxy(state, handler) as QueryObserverResult<TData, TError>;
}
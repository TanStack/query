import { describe, it, expect, vi, afterEach } from 'vitest'
import {cleanup, render, screen, waitFor} from '@testing-library/svelte'
import CreateQuery_TypeCheck from "./CreateQuery_TypeCheck.test.svelte";

import {sleep} from '../../../../../../query/packages/svelte-query/src/__tests__/utils'
import CreateQuery from "./CreateQuery.test.svelte";
import type {CreateQueryResult, CreateQueryStoreResult} from "$lib";
import {QueryClient} from "@tanstack/query-core";

afterEach(() => {
  cleanup();
})

describe('createQuery', () => {
  it('Render and wait for success', async () => {
    render(CreateQuery, {
      props: {
        queryKey: ['test'],
        queryFn: async () => {
          await sleep(100)
          return 'Success'
        },
      },
    })

    expect(screen.queryByText('Status:loading')).toBeInTheDocument()
    expect(screen.queryByText('Status:error')).not.toBeInTheDocument()
    expect(screen.queryByText('Status:success')).not.toBeInTheDocument()

    await sleep(200)

    expect(screen.queryByText('Status:success')).toBeInTheDocument()
    expect(screen.queryByText('Status:loading')).not.toBeInTheDocument()
    expect(screen.queryByText('Status:error')).not.toBeInTheDocument()
  });

  it('should have types that match the spec.', async () => {
    const {component} = render(CreateQuery_TypeCheck, {
      props: {
      }
    });

    //This is just demo code showing how to access svelte component props. Should be removed later.
    expect(component.queryKey).toBeDefined();
    if (!component.queryKey) {return}
  });


  it('should return the correct states for a successful query', async () => {

    const {component} = render(CreateQuery, {
      props: {
      },
    });

    expect(component.queryState).toBeDefined();
    if (!component.queryState) {return}
    const queryState : CreateQueryStoreResult<string, Error> = component.queryState;
    const states: CreateQueryResult<string>[] = []


    queryState.subscribe(value => {
      states.push({...value});
    });

    await waitFor(() => screen.getByText('data'));
    expect(states.length).toEqual(2);

    expect(states[0]).toEqual({
      data: undefined,
      dataUpdatedAt: 0,
      error: null,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isError: false,
      isFetched: false,
      isFetchedAfterMount: false,
      isFetching: true,
      isPaused: false,
      isLoading: true,
      isInitialLoading: true,
      isLoadingError: false,
      isPlaceholderData: false,
      isPreviousData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: true,
      isSuccess: false,
      refetch: expect.any(Function),
      remove: expect.any(Function),
      status: 'loading',
      fetchStatus: 'fetching',
    })

    expect(states[1]).toEqual({
      data: 'data',
      dataUpdatedAt: expect.any(Number),
      error: null,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isError: false,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isPaused: false,
      isLoading: false,
      isInitialLoading: false,
      isLoadingError: false,
      isPlaceholderData: false,
      isPreviousData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: true,
      isSuccess: true,
      refetch: expect.any(Function),
      remove: expect.any(Function),
      status: 'success',
      fetchStatus: 'idle',
    });
  });


  it('should return the correct states for an unsuccessful query', async () => {

    const {component} = render(CreateQuery, {
      props: {
        queryFn : () => Promise.reject("rejected"),
        options :
          {
            retry: 1,
            retryDelay: 1,
          },
      },
    });

    expect(component.queryState).toBeDefined();
    if (!component.queryState) {return}
    const queryState : CreateQueryStoreResult<unknown> = component.queryState;
    const states: CreateQueryResult<unknown>[] = []


    queryState.subscribe(value => {
      states.push({...value});
    });

    await waitFor(() => screen.getByText('Status:error'));
    expect(states.length).toEqual(3);

    expect(states[0]).toEqual({
      data: undefined,
      dataUpdatedAt: 0,
      error: null,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isError: false,
      isFetched: false,
      isFetchedAfterMount: false,
      isFetching: true,
      isPaused: false,
      isLoading: true,
      isInitialLoading: true,
      isLoadingError: false,
      isPlaceholderData: false,
      isPreviousData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: true,
      isSuccess: false,
      refetch: expect.any(Function),
      remove: expect.any(Function),
      status: 'loading',
      fetchStatus: 'fetching',
    })

    expect(states[1]).toEqual({
      data: undefined,
      dataUpdatedAt: 0,
      error: null,
      errorUpdatedAt: 0,
      failureCount: 1,
      failureReason: 'rejected',
      errorUpdateCount: 0,
      isError: false,
      isFetched: false,
      isFetchedAfterMount: false,
      isFetching: true,
      isPaused: false,
      isLoading: true,
      isInitialLoading: true,
      isLoadingError: false,
      isPlaceholderData: false,
      isPreviousData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: true,
      isSuccess: false,
      refetch: expect.any(Function),
      remove: expect.any(Function),
      status: 'loading',
      fetchStatus: 'fetching',
    })

    expect(states[2]).toEqual({
      data: undefined,
      dataUpdatedAt: 0,
      error: 'rejected',
      errorUpdatedAt: expect.any(Number),
      failureCount: 2,
      failureReason: 'rejected',
      errorUpdateCount: 1,
      isError: true,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isPaused: false,
      isLoading: false,
      isInitialLoading: false,
      isLoadingError: true,
      isPlaceholderData: false,
      isPreviousData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: true,
      isSuccess: false,
      refetch: expect.any(Function),
      remove: expect.any(Function),
      status: 'error',
      fetchStatus: 'idle',
    })
  });

  it('should set isFetchedAfterMount to true after a query has been fetched', async () => {

    const queryClient = new QueryClient();
    const queryKey = ["test_prefetch"];

    //prefetch.
    await queryClient.prefetchQuery(queryKey, () => 'prefetched');

    const {component} = render(CreateQuery, {
      props: {
        queryKey : queryKey,
        queryClient : queryClient
      },
    });

    expect(component.queryState).toBeDefined();
    if (!component.queryState) {return}
    const queryState : CreateQueryStoreResult<string> = component.queryState;

    const states: CreateQueryResult<string>[] = []

    queryState.subscribe(value => {
      states.push({...value});
    });


    await waitFor(() => screen.getByText('data'));
    expect(states.length).toBe(2);

    expect(states[0]).toMatchObject({
      data: 'prefetched',
      isFetched: true,
      isFetchedAfterMount: false,
    })
    expect(states[1]).toMatchObject({
      data: 'data',
      isFetched: true,
      isFetchedAfterMount: true,
    })
  })


  it('should call onSuccess after a query has been fetched', async () => {
    const onSuccess = vi.fn();

    const {component} = render(CreateQuery, {
      props: {
        options : {
          onSuccess : onSuccess
        }
      },
    });

    expect(component.queryState).toBeDefined();
    if (!component.queryState) {return}
    const queryState : CreateQueryStoreResult<string, Error> = component.queryState;
    const states: CreateQueryResult<string>[] = []


    queryState.subscribe(value => {
      states.push({...value});
    });

    await waitFor(() => screen.getByText('data'));
    expect(states.length).toEqual(2);

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledWith('data')
  });


  it('should call onSuccess after a query has been refetched', async () => {
    const onSuccess = vi.fn();

    let count = 0;
    const {component} = render(CreateQuery, {
      props: {
        queryFn : async () => {count++; return 'data' + count},
        options : {
          onSuccess : onSuccess
        }
      },
    });

    expect(component.queryState).toBeDefined();
    if (!component.queryState) {return}
    const queryStateStore : CreateQueryStoreResult<string, Error> = component.queryState;
    const states: CreateQueryResult<string>[] = []

    let queryState : CreateQueryResult<string, Error> | undefined = undefined;

    queryStateStore.subscribe(value => {
      states.push({...value});
      if (queryState === undefined) {
        queryState = value;
      }
    });

    await waitFor(() => screen.getByText('data1'));


    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (queryState !== undefined) {
      await (queryState as CreateQueryResult<string, Error>).refetch();
    }

    await waitFor(() => screen.getByText('data2'));

    expect(states.length).toBe(3) //loading, success, success after refetch.
    expect(count).toBe(2);
    expect(onSuccess).toHaveBeenCalledTimes(2);
  });


  it('should call onSuccess after a disabled query has been fetched', async () => {
    const onSuccess = vi.fn();

    const {component} = render(CreateQuery, {
      props: {
        queryFn : async () => {return 'data'},
        options : {
          enabled: false,
          onSuccess : onSuccess
        }
      },
    });


    expect(component.queryState).toBeDefined();
    if (!component.queryState) {return}
    const queryStateStore : CreateQueryStoreResult<string, Error> = component.queryState;
    const states: CreateQueryResult<string>[] = []

    let queryState : CreateQueryResult<string, Error> | undefined = undefined;

    queryStateStore.subscribe(value => {
      states.push({...value});
      if (queryState === undefined) {
        queryState = value;
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (queryState !== undefined) {
      await (queryState as CreateQueryResult<string, Error>).refetch();
    }
    await waitFor(() => screen.getByText('data'));

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledWith('data')
  });



  // it('should not call onSuccess if a component has unmounted', async () => {
  //   const onSuccess = vi.fn();
  //
  //   const {component} = render(CreateQuery_Successful, {
  //     props: {
  //       queryFn : async () => {return 'data'},
  //       options : {
  //         enabled: false,
  //         onSuccess : onSuccess
  //       }
  //     },
  //   });
  //
  //
  //   expect(component.queryState).toBeDefined();
  //   if (!component.queryState) {return}
  //   const queryStateStore : CreateQueryStoreResult<string, Error> = component.queryState;
  //   const states: CreateQueryResult<string>[] = []
  //
  //   let queryState : CreateQueryResult<string, Error> | undefined = undefined;
  //
  //   queryStateStore.subscribe(value => {
  //     states.push({...value});
  //     if (queryState === undefined) {
  //       queryState = value;
  //     }
  //   });
  //
  //   // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  //   if (queryState !== undefined) {
  //     await (queryState as CreateQueryResult<string, Error>).refetch();
  //   }
  //   await waitFor(() => screen.getByText('data'));
  //
  //   expect(onSuccess).toHaveBeenCalledTimes(1)
  //   expect(onSuccess).toHaveBeenCalledWith('data')
  // });


  it('should call onError after a query has been fetched with an error', async () => {
    const onError = vi.fn();

    const {component} = render(CreateQuery, {
      props: {
        queryFn : () => Promise.reject("error"),
        options : {
          retry: 1,
          retryDelay: 1,
          onError: onError
        }
      },
    });

    expect(component.queryState).toBeDefined();
    if (!component.queryState) {return}
    const queryState : CreateQueryStoreResult<unknown> = component.queryState;
    const states: CreateQueryResult<unknown>[] = []

    queryState.subscribe(value => {
      states.push({...value});
    });

    await waitFor(() => screen.getByText('Failure Reason:error'));
    expect(states.length).toBe(2);
    console.log(states);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith('error');
  });


});

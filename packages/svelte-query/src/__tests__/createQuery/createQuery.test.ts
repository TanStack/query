import { describe, it, expect } from 'vitest'
import {render, screen, waitFor} from '@testing-library/svelte'
import CreateQuery_TypeCheck from "./CreateQuery_TypeCheck.test.svelte";
import CreateQuery from "./CreateQuery.test.svelte";

import {sleep} from '../../../../../../query/packages/svelte-query/src/__tests__/utils'
import CreateQuery_State_Successful from "./CreateQuery_State_Successful.test.svelte";
import CreateQuery_State_Unsuccessful from "./CreateQuery_State_Unsuccessful.svelte";
import type {CreateQueryResult, CreateQueryStoreResult} from "$lib";

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

    expect(screen.queryByText('Loading')).toBeInTheDocument()
    expect(screen.queryByText('Error')).not.toBeInTheDocument()
    expect(screen.queryByText('Success')).not.toBeInTheDocument()

    await sleep(200)

    expect(screen.queryByText('Success')).toBeInTheDocument()
    expect(screen.queryByText('Loading')).not.toBeInTheDocument()
    expect(screen.queryByText('Error')).not.toBeInTheDocument()
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

    const {component} = render(CreateQuery_State_Successful, {
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

    await waitFor(() => screen.getByText('test'));
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
      data: 'test',
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

    const {component} = render(CreateQuery_State_Unsuccessful, {
      props: {
      },
    });

    expect(component.queryState).toBeDefined();
    if (!component.queryState) {return}
    const queryState : CreateQueryStoreResult<string[], string, undefined> = component.queryState;
    const states: CreateQueryResult<undefined, string>[] = []


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

});


import { TestBed } from '@angular/core/testing'
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http'
import {
  QueryClient,
  injectMutation,
  injectQuery,
  provideTanStackQuery,
} from '@tanstack/angular-query-experimental'
import { Injector, inject, runInInjectionContext } from '@angular/core'
import { waitFor } from '@testing-library/angular'
import { mockInterceptor } from '../interceptor/mock-api.interceptor'
import { TasksService } from './tasks.service'
import type { CreateQueryResult } from '@tanstack/angular-query-experimental'

describe('Test suite: TaskService', () => {
  let service!: TasksService
  let injector!: Injector
  let allTasks: CreateQueryResult<Array<string>, Error>
  let addTask: any
  let queryClient: QueryClient

  // https://angular.dev/guide/http/testing
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withFetch(), withInterceptors([mockInterceptor])),
        TasksService,
        // It is recommended to cancel the retries in the tests
        provideTanStackQuery(
          new QueryClient({
            defaultOptions: {
              queries: {
                retry: false,
              },
            },
          }),
        ),
      ],
    })
    service = TestBed.inject(TasksService)
    injector = TestBed.inject(Injector)

    runInInjectionContext(injector, () => {
      allTasks = injectQuery(() => service.allTasks())
      addTask = injectMutation(() => service.addTask())
      queryClient = inject(QueryClient)
    })
    expect(allTasks.status()).toEqual('pending')
    expect(allTasks.isFetching()).toEqual(true)
    expect(allTasks.data()).toEqual(undefined)
  })

  it('should create Task service', () => {
    expect(service).toBeTruthy()
  })

  it('should manage all tasks, add task, remove task', async () => {
    // We await the first result from the query
    await waitFor(() => expect(allTasks.isFetching()).toBe(false), {
      timeout: 10000,
    })
    expect(allTasks.status()).toEqual('success')
    expect(allTasks.data()).toEqual([])

    // Add a task
    const task = 'Task 1'
    const doneMutation = addTask.mutateAsync(
      {
        task,
        failMutation: false,
      },
      {
        onSuccess: (data: any, variables: any, _context: any) => {
          expect(data).toEqual({
            status: 'success',
            task: task,
          })
        },
        onError: () => {},
      },
    )

    expect(allTasks.data()).toEqual([])

    await expect(doneMutation).resolves.toEqual({
      status: 'success',
      task: 'Task 1',
    })
    // With Optimistic update the value is already available even if all tasks has not been refetch yet.
    expect(allTasks.data()).toEqual([task])

    // We await the invalidation of the 'tasks' query cache to have worked
    // We test here that the new cache is the one returned by the interceptor
    // and no longer the optimistic cache.
    await waitFor(
      () => expect(allTasks.data()).toEqual([task, 'CallNumber 2']),
      { timeout: 10000 },
    )

    // Reset the mutation
    addTask.reset()
    expect(addTask.isPending()).toBe(false)

    // Test a mutation error now
    const taskError = 'Task 2'
    const doneMutationError = addTask.mutateAsync(
      {
        task: taskError,
        failMutation: true,
      },
      {
        onError: (data: any, _variables: any, _context: any) => {
          expect(data).toEqual(new Error('error'))
        },
      },
    )
    // To test the optimistic update we need to wait for the mutation to be in progress
    expect(queryClient.getQueryData(['tasks'])).toEqual([task, 'CallNumber 2'])
    await waitFor(() => expect(addTask.isIdle()).toBe(false), {
      timeout: 10000,
    })
    await waitFor(() => expect(addTask.isPending()).toBe(false), {
      timeout: 10000,
    })
    // Now we have finished the optimistic update but before the error
    expect(queryClient.getQueryData(['tasks'])).toEqual([
      task,
      'CallNumber 2',
      taskError,
    ])
    await expect(doneMutationError).rejects.toThrow('error')
    // We test here that the new cache is the one that was rolled back
    // and no longer the optimistic cache.
    expect(allTasks.data()).toEqual([task, 'CallNumber 2'])
  })
})

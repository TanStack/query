import { Component, provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/angular'
import { sleep } from '@tanstack/query-test-utils'
import {
  QueryCache,
  QueryClient,
  mutationResource,
  onlineManager,
  provideTanStackQuery,
} from '..'

// Ported from angular-resource-query: mutation-resilience.spec.ts, plus the
// mutationResource lifecycle and optimistic-update coverage from the README examples.
describe('mutationResource', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient({ queryCache: new QueryCache() })
    onlineManager.setOnline(true)
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(queryClient),
      ],
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('runs imperatively and exposes the result as a resource', async () => {
    @Component({
      template: `
        <div>mutationStatus: {{ m.mutationStatus() }}</div>
        <div>status: {{ m.status() }}</div>
        <div>data: {{ m.data() ?? 'none' }}</div>
      `,
    })
    class Page {
      readonly m = mutationResource({
        mutationFn: (title: string) => sleep(10).then(() => `saved:${title}`),
      })
    }

    const rendered = await render(Page)
    expect(rendered.getByText('mutationStatus: idle')).toBeInTheDocument()
    expect(rendered.getByText('status: idle')).toBeInTheDocument()

    rendered.fixture.componentInstance.m.mutate('todo')
    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()

    expect(rendered.getByText('mutationStatus: success')).toBeInTheDocument()
    expect(rendered.getByText('status: resolved')).toBeInTheDocument()
    expect(rendered.getByText('data: saved:todo')).toBeInTheDocument()
  })

  it('retries a failing mutation up to the configured count', async () => {
    @Component({ template: `<div>{{ m.mutationStatus() }}</div>` })
    class Page {
      readonly fn = vi
        .fn()
        .mockImplementationOnce(() =>
          sleep(5).then(() => Promise.reject(new Error('transient'))),
        )
        .mockImplementationOnce(() => sleep(5).then(() => 'ok'))
      readonly m = mutationResource<string, Error, void>({
        mutationFn: () => this.fn(),
        retry: 1,
        retryDelay: 0,
      })
    }

    const rendered = await render(Page)
    const instance = rendered.fixture.componentInstance
    const result = instance.m.mutateAsync()
    await vi.advanceTimersByTimeAsync(20)
    rendered.fixture.detectChanges()

    await expect(result).resolves.toBe('ok')
    expect(instance.fn).toHaveBeenCalledTimes(2)
    expect(instance.m.isSuccess()).toBe(true)
  })

  it('does not retry by default and surfaces the error', async () => {
    @Component({ template: `<div>{{ m.mutationStatus() }}</div>` })
    class Page {
      readonly fn = vi
        .fn()
        .mockImplementation(() =>
          sleep(5).then(() => Promise.reject(new Error('nope'))),
        )
      readonly m = mutationResource<string, Error, void>({
        mutationFn: () => this.fn(),
      })
    }

    const rendered = await render(Page)
    const instance = rendered.fixture.componentInstance
    const result = instance.m.mutateAsync()
    await vi.advanceTimersByTimeAsync(6)
    rendered.fixture.detectChanges()

    await expect(result).rejects.toThrow('nope')
    expect(instance.fn).toHaveBeenCalledTimes(1)
    expect(instance.m.isError()).toBe(true)
  })

  it('pauses while offline and completes on reconnect (networkMode online)', async () => {
    onlineManager.setOnline(false)

    @Component({ template: `<div>{{ m.mutationStatus() }}</div>` })
    class Page {
      readonly fn = vi.fn().mockImplementation(() => sleep(5).then(() => 'done'))
      readonly m = mutationResource<string, Error, void>({
        mutationFn: () => this.fn(),
        networkMode: 'online',
      })
    }

    const rendered = await render(Page)
    const instance = rendered.fixture.componentInstance
    const settled = instance.m.mutateAsync()
    await vi.advanceTimersByTimeAsync(0)
    rendered.fixture.detectChanges()

    // Paused offline: still pending, mutationFn not yet called.
    expect(instance.m.isPending()).toBe(true)
    expect(instance.fn).not.toHaveBeenCalled()

    onlineManager.setOnline(true)
    await vi.advanceTimersByTimeAsync(6)
    rendered.fixture.detectChanges()

    await settled
    expect(instance.fn).toHaveBeenCalledTimes(1)
    expect(instance.m.isSuccess()).toBe(true)
  })

  it('supports optimistic updates with rollback on error', async () => {
    queryClient.setQueryData(['todos'], ['a'])

    @Component({ template: `<div>{{ m.mutationStatus() }}</div>` })
    class Page {
      readonly m = mutationResource<
        string,
        Error,
        string,
        { previous: Array<string> | undefined }
      >({
        mutationFn: () =>
          sleep(10).then(() => Promise.reject(new Error('fail'))),
        onMutate: (title) => {
          const previous = queryClient.getQueryData<Array<string>>(['todos'])
          queryClient.setQueryData<Array<string>>(['todos'], (old) => [
            ...(old ?? []),
            title,
          ])
          return { previous }
        },
        onError: (_error, _vars, context) => {
          if (context?.previous) {
            queryClient.setQueryData(['todos'], context.previous)
          }
        },
        retry: false,
      })
    }

    const rendered = await render(Page)
    rendered.fixture.componentInstance.m.mutate('b')

    // onMutate applied the optimistic value.
    await vi.advanceTimersByTimeAsync(0)
    expect(queryClient.getQueryData(['todos'])).toEqual(['a', 'b'])

    // mutationFn rejects → onError rolls back.
    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()
    expect(queryClient.getQueryData(['todos'])).toEqual(['a'])
    expect(rendered.fixture.componentInstance.m.isError()).toBe(true)
  })

  it('reset() returns the mutation to idle', async () => {
    @Component({ template: `<div>{{ m.mutationStatus() }}</div>` })
    class Page {
      readonly m = mutationResource({
        mutationFn: (title: string) => sleep(10).then(() => `saved:${title}`),
      })
    }

    const rendered = await render(Page)
    const instance = rendered.fixture.componentInstance
    instance.m.mutate('x')
    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()
    expect(instance.m.isSuccess()).toBe(true)

    instance.m.reset()
    rendered.fixture.detectChanges()
    expect(instance.m.isIdle()).toBe(true)
    expect(instance.m.data()).toBeUndefined()
  })
})

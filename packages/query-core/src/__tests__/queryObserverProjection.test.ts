import { createKey } from '@tanstack/query-test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  QueryClient,
  QueryObserver,
  clearQueryClient,
  defaultQueryFn,
  defaultQueryOptions,
  getQueryData,
  getQueryState,
  noop,
  resetQueries,
  select as selectData,
  setQueryData,
  placeholderData as withPlaceholder,
} from '..'

describe('observer data outcome after reset', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
  })

  afterEach(() => {
    clearQueryClient(queryClient)
  })

  it('should not restore removed data when select throws for placeholderData after reset', async () => {
    const key = createKey()
    setQueryData(queryClient, key, { label: 'first' })
    const placeholder: { label: string | null } = { label: null }
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: () => new Promise<{ label: string | null }>(() => {}),
      enabled: false,
      placeholderData: withPlaceholder(placeholder),
      select: selectData((row) => {
        if (row.label === null) throw new Error('label not ready')
        return row.label
      }),
    })
    const unsubscribe = observer.subscribe(() => {})

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'success',
      data: 'first',
      isPlaceholderData: false,
    })

    await resetQueries(queryClient, { queryKey: key })

    expect(getQueryData(queryClient, key)).toBeUndefined()
    expect(observer.getCurrentResult()).toMatchObject({
      status: 'error',
      data: undefined,
      isPlaceholderData: false,
    })
    unsubscribe()
  })

  it('should drop removed data when the placeholder selector error was already memoized', async () => {
    const key = createKey()
    const error = new Error('label not ready')
    const select = vi.fn<(row: { label: string | null }) => string>((row) => {
      if (row.label === null) throw error
      return row.label
    })
    const options = {
      queryKey: key,
      queryFn: defaultQueryFn,
      enabled: false,
      placeholderData: withPlaceholder({ label: null }),
      select: selectData(select),
    } as const
    setQueryData(queryClient, key, { label: 'first' })
    const observer = new QueryObserver(queryClient, options)
    const unsubscribe = observer.subscribe(noop)
    try {
      const reader = observer.createResultReader(
        defaultQueryOptions(queryClient, { ...options, queryKey: createKey() }),
      )
      expect(reader.getSnapshot()).toMatchObject({
        status: 'error',
        data: 'first',
        error,
      })
      expect(select).toHaveBeenCalledTimes(2)

      await resetQueries(queryClient, { queryKey: key })

      expect(getQueryData(queryClient, key)).toBeUndefined()
      const callsAfterReset = select.mock.calls.length
      const afterReset = reader.getSnapshot()
      expect(afterReset.error).toBe(error)
      expect(select).toHaveBeenCalledTimes(callsAfterReset)
      expect(afterReset).toMatchObject({
        status: 'error',
        data: undefined,
        isPlaceholderData: false,
      })
    } finally {
      unsubscribe()
    }
  })
})

describe('observer callback errors', () => {
  it('should keep a factory error stable through repeated reads and commit', () => {
    const client = new QueryClient()
    const queryKey = createKey()
    const options = defaultQueryOptions<number>(client, {
      queryKey,
      enabled: false,
    })
    const observer = new QueryObserver(client, options)
    const placeholderData = vi.fn<() => never>(() => {
      throw new Error('placeholder failed')
    })
    const reader = observer.createResultReader({
      ...options,
      placeholderData: withPlaceholder(placeholderData),
    })

    try {
      const result = reader.getSnapshot()
      expect(result).toMatchObject({
        status: 'error',
        error: new Error('placeholder failed'),
        data: undefined,
      })
      expect(reader.getSnapshot()).toBe(result)
      reader.commit()
      expect(observer.getCurrentResult().error).toBe(result.error)
      expect(placeholderData).toHaveBeenCalledExactlyOnceWith(
        undefined,
        undefined,
      )
      expect(getQueryState(client, queryKey)?.status).toBe('pending')

      setQueryData(client, queryKey, 1)
      expect(reader.getSnapshot()).toMatchObject({
        status: 'success',
        error: null,
        data: 1,
      })
    } finally {
      clearQueryClient(client)
    }
  })

  it('should report a falsy selector error and clear it when select is removed', () => {
    const client = new QueryClient()
    const options = {
      queryKey: createKey(),
      queryFn: defaultQueryFn,
      initialData: 1,
      enabled: false,
    } as const
    const observer = new QueryObserver(client, {
      ...options,
      select: selectData(() => {
        throw undefined
      }),
    })
    try {
      expect(observer.getCurrentResult()).toMatchObject({
        status: 'error',
        error: undefined,
        data: undefined,
      })
      observer.setOptions(options)
      expect(observer.getCurrentResult()).toMatchObject({
        status: 'success',
        error: null,
        data: 1,
      })
    } finally {
      clearQueryClient(client)
    }
  })

  it('should recompute a selection when structural sharing changes', () => {
    const client = new QueryClient()
    const options = defaultQueryOptions(client, {
      queryKey: createKey(),
      initialData: 1,
      enabled: false,
      select: selectData((value: number) => value * 2),
    })
    const observer = new QueryObserver(client, options)
    const reader = observer.createResultReader({
      ...options,
      structuralSharing: (_previous, value) => Number(value) + 1,
    })

    try {
      expect(observer.getCurrentResult().data).toBe(2)
      const snapshot = reader.getSnapshot()
      expect(snapshot.data).toBe(3)
      expect(reader.getSnapshot()).toBe(snapshot)
      reader.commit()
      expect(observer.getCurrentResult().data).toBe(3)
    } finally {
      clearQueryClient(client)
    }
  })

  it('should reuse the placeholder across readers until the factory changes', () => {
    const client = new QueryClient()
    const placeholderData = vi.fn<() => { value: number }>(() => ({ value: 1 }))
    const options = defaultQueryOptions<{ value: number }>(client, {
      queryKey: createKey(),
      enabled: false,
      placeholderData: withPlaceholder(placeholderData),
      structuralSharing: false,
    })
    const observer = new QueryObserver(client, options)

    try {
      const firstReader = observer.createResultReader(options)
      const first = firstReader.getSnapshot()
      expect(firstReader.getSnapshot()).toBe(first)
      expect(placeholderData).toHaveBeenCalledTimes(1)

      const sameFactory = observer.createResultReader({ ...options })
      expect(sameFactory.getSnapshot()).toBe(first)
      expect(placeholderData).toHaveBeenCalledTimes(1)

      const secondReader = observer.createResultReader({
        ...options,
        placeholderData: withPlaceholder(() => placeholderData()),
      })
      const second = secondReader.getSnapshot()
      expect(secondReader.getSnapshot()).toBe(second)
      expect(second.data).toStrictEqual(first.data)
      expect(second.data).not.toBe(first.data)
      expect(placeholderData).toHaveBeenCalledTimes(2)
      expect(observer.getCurrentResult()).toBe(first)

      secondReader.commit()
      expect(observer.getCurrentResult().data).toBe(second.data)
      expect(placeholderData).toHaveBeenCalledTimes(2)
    } finally {
      clearQueryClient(client)
    }
  })
})

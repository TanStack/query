import { describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryObserver, placeholderData, select } from '..'
import { getQueryData, setQueryData, setQueryDefaults } from '../queryClient'

describe('projection options', () => {
  it('reuses a stable selector and placeholder factory when option pairs are recreated', () => {
    const client = new QueryClient()
    const placeholder = vi.fn<() => { count: number }>(() => ({ count: 1 }))
    const count = vi.fn<(value: { count: number }) => number>(
      (value) => value.count,
    )
    const options = () => ({
      queryKey: ['count'],
      queryFn: () => Promise.resolve({ count: 2 }),
      placeholderData: placeholderData(placeholder),
      select: select(count),
    })
    const observer = new QueryObserver(client, options())
    expect(observer.getCurrentResult()).toMatchObject({
      data: 1,
      isPlaceholderData: true,
    })
    observer.setOptions(options())
    expect(placeholder).toHaveBeenCalledTimes(1)
    expect(count).toHaveBeenCalledTimes(1)
    setQueryData(client, ['count'], { count: 2 })
    observer.setOptions(options())
    expect(observer.getCurrentResult()).toMatchObject({
      data: 2,
      isPlaceholderData: false,
    })
  })

  it('keeps selection state and errors separate for observers sharing a default', () => {
    const client = new QueryClient()
    const transform = (value: unknown) => {
      if (typeof value !== 'number') throw new TypeError('Expected a number')
      return value * 2
    }
    setQueryDefaults(client, ['entry'], { select: select(transform) })
    const a = new QueryObserver(client, {
      queryKey: ['entry', 'a'],
      queryFn: () => 2,
      initialData: 2,
    })
    const b = new QueryObserver(client, {
      queryKey: ['entry', 'b'],
      queryFn: () => 'invalid',
      initialData: 'invalid',
    })
    expect(a.getCurrentResult()).toMatchObject({ status: 'success', data: 4 })
    expect(b.getCurrentResult()).toMatchObject({
      status: 'error',
      data: undefined,
      error: expect.any(TypeError),
    })
    expect(getQueryData(client, ['entry', 'b'])).toBe('invalid')
  })
})

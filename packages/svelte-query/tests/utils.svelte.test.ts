import { flushSync } from 'svelte'
import { describe, expect, it, vi } from 'vitest'
import { watchChanges } from '../src/utils.svelte.js'
import { ref, withEffectRoot } from './utils.svelte.js'

describe('watchChanges', () => {
  it(
    'should skip the first run and only call the effect on subsequent changes',
    withEffectRoot(() => {
      const source = ref(0)
      const effect = vi.fn()

      watchChanges(() => source.value, 'pre', effect)

      // first run only records previousValues, effect is not called
      flushSync()
      expect(effect).not.toHaveBeenCalled()

      source.value = 1
      flushSync()
      expect(effect).toHaveBeenCalledExactlyOnceWith(1, 0)
    }),
  )

  it(
    'should run with the "post" flush timing',
    withEffectRoot(() => {
      const source = ref(0)
      const effect = vi.fn()

      watchChanges(() => source.value, 'post', effect)

      flushSync()
      expect(effect).not.toHaveBeenCalled()

      source.value = 1
      flushSync()
      expect(effect).toHaveBeenCalledExactlyOnceWith(1, 0)
    }),
  )

  it(
    'should track an array of sources and pass arrays of values',
    withEffectRoot(() => {
      const a = ref(1)
      const b = ref(2)
      const effect = vi.fn()

      watchChanges([() => a.value, () => b.value], 'pre', effect)

      flushSync()
      expect(effect).not.toHaveBeenCalled()

      a.value = 10
      flushSync()
      expect(effect).toHaveBeenCalledExactlyOnceWith([10, 2], [1, 2])
    }),
  )

  it(
    'should run the returned cleanup before the next effect run',
    withEffectRoot(() => {
      const source = ref(0)
      const cleanup = vi.fn()
      const effect = vi.fn(() => cleanup)

      watchChanges(() => source.value, 'pre', effect)

      flushSync()
      source.value = 1
      flushSync()
      expect(cleanup).not.toHaveBeenCalled()

      source.value = 2
      flushSync()
      expect(cleanup).toHaveBeenCalledOnce()
    }),
  )
})

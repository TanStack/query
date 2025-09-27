import { flushSync } from 'svelte'
import { describe, expect, it } from 'vitest'
import { createRawRef } from '../src/containers.svelte.js'
import { withEffectRoot } from './utils.svelte.js'

describe('createRawRef', () => {
  it('should create a reactive reference', () => {
    const [ref, update] = createRawRef({ a: 1, b: 2 })

    expect(ref).toEqual({ a: 1, b: 2 })

    update({ a: 3, b: 4 })
    expect(ref).toEqual({ a: 3, b: 4 })

    ref.a = 5
    expect(ref).toEqual({ a: 5, b: 4 })
  })

  it('should handle nested objects', () => {
    const [ref, update] = createRawRef<{ a: any }>({ a: { b: { c: 1 } } })

    expect(ref).toEqual({ a: { b: { c: 1 } } })

    // update with same structure
    update({ a: { b: { c: 2 } } })
    expect(ref).toEqual({ a: { b: { c: 2 } } })

    ref.a.b.c = 3
    expect(ref).toEqual({ a: { b: { c: 3 } } })

    // update with different structure should wipe out everything below the first level
    update({ a: { b: 3 } })
    expect(ref).toEqual({ a: { b: 3 } })
  })

  it('should remove properties when a new object is assigned', () => {
    const [ref, update] = createRawRef<Record<string, number>>({
      a: 1,
      b: 2,
    })

    expect(ref).toEqual({ a: 1, b: 2 })

    update({ a: 3 })
    expect(ref).toEqual({ a: 3 })
  })

  it(
    'should not break reactivity when removing keys',
    withEffectRoot(() => {
      const [ref, update] = createRawRef<Record<string, number>>({ a: 1, b: 2 })
      const states: Array<number | undefined> = []
      $effect(() => {
        states.push(ref.b)
      })

      // these flushSync calls force the effect to run and push the value to the states array
      flushSync()
      update({ a: 3 }) // should remove b, and should rerun the effect
      flushSync()
      update({ a: 3, b: 4 }) // should add b back, and should rerun the effect
      flushSync()
      delete ref.b // should remove b, and should rerun the effect
      flushSync()
      delete ref.a // should remove a, and should _not_ rerun the effect
      expect(states).toEqual([2, undefined, 4, undefined])
    }),
  )

  it(
    'should correctly trap calls to `in`',
    withEffectRoot(() => {
      const [ref, update] = createRawRef<Record<string, number>>({
        a: 1,
        b: 2,
      })

      expect('b' in ref).toBe(true)
      delete ref.b
      expect('b' in ref).toBe(false)
      update({})
      expect('a' in ref).toBe(false)
      update({ a: 1, b: 2 })
      expect('b' in ref).toBe(true)
      expect('a' in ref).toBe(true)
    }),
  )

  it('should correctly trap calls to `ownKeys`', () => {
    const [ref, update] = createRawRef<Record<string, number>>({
      a: 1,
      b: 2,
    })

    expect(Object.keys(ref)).toEqual(['a', 'b'])

    delete ref.b
    expect(Reflect.ownKeys(ref)).toEqual(['a'])

    update({})
    expect(Object.keys(ref)).toEqual([])

    update({ a: 1, b: 2 })
    expect(Object.keys(ref)).toEqual(['a', 'b'])
  })

  it('should correctly trap calls to `getOwnPropertyDescriptor`', () => {
    const [ref, update] = createRawRef<Record<string, number>>({
      a: 1,
      b: 2,
    })

    expect(Reflect.getOwnPropertyDescriptor(ref, 'b')).toEqual({
      configurable: true,
      enumerable: true,
      get: expect.any(Function),
      set: expect.any(Function),
    })

    delete ref.b
    expect(Reflect.getOwnPropertyDescriptor(ref, 'b')).toEqual(undefined)

    update({})
    expect(Reflect.getOwnPropertyDescriptor(ref, 'a')).toEqual(undefined)

    update({ a: 1, b: 2 })
    expect(Reflect.getOwnPropertyDescriptor(ref, 'a')).toEqual({
      configurable: true,
      enumerable: true,
      get: expect.any(Function),
      set: expect.any(Function),
    })
    expect(Reflect.getOwnPropertyDescriptor(ref, 'b')).toEqual({
      configurable: true,
      enumerable: true,
      get: expect.any(Function),
      set: expect.any(Function),
    })
  })

  it('should lazily access values when using `update`', () => {
    let aAccessed = false
    let bAccessed = false
    const [ref, update] = createRawRef({
      get a() {
        aAccessed = true
        return 1
      },
      get b() {
        bAccessed = true
        return 2
      },
    })

    expect(aAccessed).toBe(false)
    expect(bAccessed).toBe(false)

    expect(ref.a).toBe(1)

    expect(aAccessed).toBe(true)
    expect(bAccessed).toBe(false)

    aAccessed = false
    bAccessed = false

    update({
      get a() {
        aAccessed = true
        return 2
      },
      get b() {
        bAccessed = true
        return 3
      },
    })

    expect(aAccessed).toBe(false)
    expect(bAccessed).toBe(false)

    expect(ref.a).toBe(2)

    expect(aAccessed).toBe(true)
    expect(bAccessed).toBe(false)
  })

  it('should handle arrays', () => {
    const [ref, update] = createRawRef([1, 2, 3])

    expect(ref).toEqual([1, 2, 3])

    ref[0] = 4
    expect(ref).toEqual([4, 2, 3])

    update([5, 6])
    expect(ref).toEqual([5, 6])

    update([7, 8, 9])
    expect(ref).toEqual([7, 8, 9])
  })

  it('should behave like a regular object when not using `update`', () => {
    const [ref] = createRawRef<Record<string, unknown>>({ a: 1, b: 2 })

    expect(ref).toEqual({ a: 1, b: 2 })

    ref.a = 3
    expect(ref).toEqual({ a: 3, b: 2 })

    ref.b = 4
    expect(ref).toEqual({ a: 3, b: 4 })

    ref.c = 5
    expect(ref).toEqual({ a: 3, b: 4, c: 5 })

    ref.fn = () => 6
    expect(ref).toEqual({ a: 3, b: 4, c: 5, fn: expect.any(Function) })
    expect((ref.fn as () => number)()).toBe(6)
  })
})

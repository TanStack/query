import { describe, expectTypeOf, it } from 'vitest'
import { onlineManager } from '..'
import type { OnlineManager } from '..'

describe('onlineManager', () => {
  describe('OnlineManager', () => {
    it('should type the singleton as an OnlineManager', () => {
      expectTypeOf(onlineManager).toEqualTypeOf<OnlineManager>()
    })

    it('should only expose its documented members', () => {
      expectTypeOf<keyof OnlineManager>().toEqualTypeOf<
        | 'subscribe'
        | 'hasListeners'
        | 'setEventListener'
        | 'setOnline'
        | 'isOnline'
      >()
    })
  })

  describe('subscribe', () => {
    it('should take a listener of the online state and return an unsubscribe function', () => {
      expectTypeOf(onlineManager.subscribe).parameters.toEqualTypeOf<
        [listener: (online: boolean) => void]
      >()
      expectTypeOf(onlineManager.subscribe).returns.toEqualTypeOf<() => void>()
    })

    it('should reject a listener that takes a non-boolean online state', () => {
      // @ts-expect-error the online state handed to a listener is a boolean
      const unsubscribe = onlineManager.subscribe((online: string) => online)

      expectTypeOf(unsubscribe).toEqualTypeOf<() => void>()
    })
  })

  describe('hasListeners', () => {
    it('should take no arguments and return a boolean', () => {
      expectTypeOf(onlineManager.hasListeners).parameters.toEqualTypeOf<[]>()
      expectTypeOf(onlineManager.hasListeners).returns.toEqualTypeOf<boolean>()
    })
  })

  describe('setEventListener', () => {
    it('should only accept a setup function and return void', () => {
      expectTypeOf(onlineManager.setEventListener).parameters.toEqualTypeOf<
        [
          setup: (
            setOnline: (online: boolean) => void,
          ) => (() => void) | undefined,
        ]
      >()
      expectTypeOf(onlineManager.setEventListener).returns.toEqualTypeOf<void>()
    })

    it('should require an argument on the setOnline callback', () => {
      // Unlike `focusManager`, there is no "re-evaluate the current state"
      // mode here, so the online state always has to be passed explicitly.
      type Setup = Parameters<OnlineManager['setEventListener']>[0]

      expectTypeOf<Parameters<Setup>[0]>().toEqualTypeOf<
        (online: boolean) => void
      >()
      expectTypeOf<
        Parameters<Parameters<Setup>[0]>['length']
      >().toEqualTypeOf<1>()
    })

    it('should let the setup function opt out of returning a cleanup function', () => {
      type Setup = Parameters<OnlineManager['setEventListener']>[0]

      expectTypeOf<ReturnType<Setup>>().toEqualTypeOf<
        (() => void) | undefined
      >()
    })
  })

  describe('setOnline', () => {
    it('should require a boolean and return void', () => {
      expectTypeOf(onlineManager.setOnline).parameters.toEqualTypeOf<
        [online: boolean]
      >()
      expectTypeOf(onlineManager.setOnline).returns.toEqualTypeOf<void>()
    })

    it('should not be callable without the online state', () => {
      expectTypeOf<
        Parameters<OnlineManager['setOnline']>['length']
      >().toEqualTypeOf<1>()
    })
  })

  describe('isOnline', () => {
    it('should take no arguments and return a boolean', () => {
      expectTypeOf(onlineManager.isOnline).parameters.toEqualTypeOf<[]>()
      expectTypeOf(onlineManager.isOnline).returns.toEqualTypeOf<boolean>()
    })
  })
})

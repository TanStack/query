import { describe, expectTypeOf, it } from 'vitest'
import { focusManager } from '..'
import type { FocusManager } from '..'

describe('focusManager', () => {
  describe('FocusManager', () => {
    it('should type the singleton as a FocusManager', () => {
      expectTypeOf(focusManager).toEqualTypeOf<FocusManager>()
    })

    it('should only expose its documented members', () => {
      expectTypeOf<keyof FocusManager>().toEqualTypeOf<
        | 'subscribe'
        | 'hasListeners'
        | 'setEventListener'
        | 'setFocused'
        | 'onFocus'
        | 'isFocused'
      >()
    })
  })

  describe('subscribe', () => {
    it('should take a listener of the focus state and return an unsubscribe function', () => {
      expectTypeOf(focusManager.subscribe).parameters.toEqualTypeOf<
        [listener: (focused: boolean) => void]
      >()
      expectTypeOf(focusManager.subscribe).returns.toEqualTypeOf<() => void>()
    })

    it('should reject a listener that takes a non-boolean focus state', () => {
      // @ts-expect-error the focus state handed to a listener is a boolean
      const unsubscribe = focusManager.subscribe((focused: string) => focused)

      expectTypeOf(unsubscribe).toEqualTypeOf<() => void>()
    })
  })

  describe('hasListeners', () => {
    it('should take no arguments and return a boolean', () => {
      expectTypeOf(focusManager.hasListeners).parameters.toEqualTypeOf<[]>()
      expectTypeOf(focusManager.hasListeners).returns.toEqualTypeOf<boolean>()
    })
  })

  describe('setEventListener', () => {
    it('should only accept a setup function and return void', () => {
      expectTypeOf(focusManager.setEventListener).parameters.toEqualTypeOf<
        [
          setup: (
            setFocused: (focused?: boolean) => void,
          ) => (() => void) | undefined,
        ]
      >()
      expectTypeOf(focusManager.setEventListener).returns.toEqualTypeOf<void>()
    })

    it('should hand the setup function a setFocused callback whose argument is optional', () => {
      // Unlike `onlineManager`, the focus callback may be called with no
      // argument at all to re-evaluate the current focus state.
      type Setup = Parameters<FocusManager['setEventListener']>[0]

      expectTypeOf<Parameters<Setup>[0]>().toEqualTypeOf<
        (focused?: boolean) => void
      >()
      expectTypeOf<Parameters<Parameters<Setup>[0]>['length']>().toEqualTypeOf<
        0 | 1
      >()
    })

    it('should let the setup function opt out of returning a cleanup function', () => {
      type Setup = Parameters<FocusManager['setEventListener']>[0]

      expectTypeOf<ReturnType<Setup>>().toEqualTypeOf<
        (() => void) | undefined
      >()
    })
  })

  describe('setFocused', () => {
    it('should take an optional boolean and return void', () => {
      expectTypeOf(focusManager.setFocused).parameters.toEqualTypeOf<
        [focused?: boolean]
      >()
      expectTypeOf(focusManager.setFocused).returns.toEqualTypeOf<void>()
    })

    it('should be callable with no argument to fall back to the default check', () => {
      expectTypeOf<
        Parameters<FocusManager['setFocused']>['length']
      >().toEqualTypeOf<0 | 1>()
    })
  })

  describe('onFocus', () => {
    it('should take no arguments and return void', () => {
      expectTypeOf(focusManager.onFocus).parameters.toEqualTypeOf<[]>()
      expectTypeOf(focusManager.onFocus).returns.toEqualTypeOf<void>()
    })
  })

  describe('isFocused', () => {
    it('should take no arguments and return a boolean', () => {
      expectTypeOf(focusManager.isFocused).parameters.toEqualTypeOf<[]>()
      expectTypeOf(focusManager.isFocused).returns.toEqualTypeOf<boolean>()
    })
  })
})

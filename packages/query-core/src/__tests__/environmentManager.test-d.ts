import { describe, expectTypeOf, it } from 'vitest'
import { environmentManager } from '..'
import { isServer } from '../environmentManager'
import type { IsServerValue } from '../environmentManager'

describe('environmentManager', () => {
  describe('IsServerValue', () => {
    it('should take no arguments and return a boolean', () => {
      expectTypeOf<IsServerValue>().toEqualTypeOf<() => boolean>()
    })

    it('should reject an override that returns a non-boolean', () => {
      // @ts-expect-error the server check has to answer with a boolean
      const invalid: IsServerValue = () => 'server'

      expectTypeOf(invalid).toEqualTypeOf<() => boolean>()
    })

    it('should reject an override that requires an argument', () => {
      // @ts-expect-error the server check is called without any argument
      const invalid: IsServerValue = (_: string) => true

      expectTypeOf(invalid).toEqualTypeOf<() => boolean>()
    })
  })

  describe('isServer', () => {
    it('should be a function returning a boolean, not a boolean constant', () => {
      // `utils.isServer` is a boolean constant evaluated once at module load,
      // while this one re-runs the (overridable) check on every call.
      expectTypeOf(isServer).toEqualTypeOf<() => boolean>()
      expectTypeOf(isServer()).toEqualTypeOf<boolean>()
    })

    it('should take no parameters', () => {
      expectTypeOf(isServer).parameters.toEqualTypeOf<[]>()
    })
  })

  describe('environmentManager', () => {
    it('should expose exactly isServer and setIsServer', () => {
      expectTypeOf<keyof typeof environmentManager>().toEqualTypeOf<
        'isServer' | 'setIsServer'
      >()
    })

    it('should expose isServer as the standalone check', () => {
      expectTypeOf(environmentManager.isServer).toEqualTypeOf<() => boolean>()
    })

    describe('setIsServer', () => {
      it('should only accept an IsServerValue and return void', () => {
        expectTypeOf(environmentManager.setIsServer).parameters.toEqualTypeOf<
          [isServerValue: IsServerValue]
        >()
        expectTypeOf(
          environmentManager.setIsServer,
        ).returns.toEqualTypeOf<void>()
      })
    })
  })
})

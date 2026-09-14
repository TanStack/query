import { describe, expectTypeOf, it } from 'vitest'
import { Subscribable } from '../subscribable'

describe('subscribable', () => {
  describe('Subscribable', () => {
    describe('TListener', () => {
      it('should only accept a function type', () => {
        // @ts-expect-error a listener must extend Function
        new Subscribable<string>()

        expectTypeOf(new Subscribable<() => void>()).toEqualTypeOf<
          Subscribable<() => void>
        >()
      })

      it('should accept a function type with parameters and a return type', () => {
        expectTypeOf(
          new Subscribable<(value: number) => string>(),
        ).toEqualTypeOf<Subscribable<(value: number) => string>>()
      })

      it('should accept any Function subtype, not just a call signature', () => {
        // `Function` is wider than `(...args: Array<any>) => any`: a construct
        // signature and a function carrying extra properties both satisfy the
        // former but not the latter.
        type Constructor = new () => object
        interface CallableWithProperty extends Function {
          custom: number
        }

        expectTypeOf(new Subscribable<Constructor>()).toEqualTypeOf<
          Subscribable<Constructor>
        >()
        expectTypeOf(new Subscribable<CallableWithProperty>()).toEqualTypeOf<
          Subscribable<CallableWithProperty>
        >()
      })

      it('should not have a default type argument', () => {
        // @ts-expect-error a listener type must be provided
        type WithoutArgument = Subscribable

        // the `@ts-expect-error` above is the verification here: omitting the
        // argument has to be an error. It leaves the alias as the error type,
        // so there is no positive assertion to pair it with -- these only
        // record that the erroring alias is `any` while a supplied one is not.
        expectTypeOf<WithoutArgument>().toBeAny()
        expectTypeOf<Subscribable<() => void>>().not.toBeAny()
      })
    })

    it('should only expose subscribe and hasListeners', () => {
      expectTypeOf<keyof Subscribable<() => void>>().toEqualTypeOf<
        'subscribe' | 'hasListeners'
      >()
    })

    describe('constructor', () => {
      it('should not accept any argument', () => {
        expectTypeOf<
          ConstructorParameters<typeof Subscribable>
        >().toEqualTypeOf<[]>()
      })
    })

    describe('subscribe', () => {
      it('should accept the listener type as its only parameter', () => {
        const subscribable = new Subscribable<(value: number) => string>()

        expectTypeOf(subscribable.subscribe).parameters.toEqualTypeOf<
          [listener: (value: number) => string]
        >()
      })

      it('should return an unsubscribe function that takes no argument and returns void', () => {
        const subscribable = new Subscribable<() => void>()

        expectTypeOf(subscribable.subscribe).returns.toEqualTypeOf<() => void>()
        expectTypeOf(subscribable.subscribe(() => {})).toEqualTypeOf<
          () => void
        >()
      })

      it('should reject a listener that does not match the listener type', () => {
        const subscribable = new Subscribable<(value: number) => string>()

        // @ts-expect-error the listener must return a string
        subscribable.subscribe((value: number) => value)

        expectTypeOf(
          subscribable.subscribe((value: number) => String(value)),
        ).toEqualTypeOf<() => void>()
      })
    })

    describe('hasListeners', () => {
      it('should take no argument and return a boolean', () => {
        const subscribable = new Subscribable<() => void>()

        expectTypeOf(subscribable.hasListeners).parameters.toEqualTypeOf<[]>()
        expectTypeOf(subscribable.hasListeners).returns.toEqualTypeOf<boolean>()
      })
    })

    describe('listeners', () => {
      it('should not be accessible from outside the class', () => {
        const subscribable = new Subscribable<() => void>()

        // @ts-expect-error listeners is protected
        subscribable.listeners

        expectTypeOf(subscribable).not.toHaveProperty('listeners')
      })

      it('should be a set of listeners inside the class', () => {
        class CustomSubscribable extends Subscribable<(value: number) => void> {
          getListeners() {
            expectTypeOf(this.listeners).toEqualTypeOf<
              Set<(value: number) => void>
            >()
            return this.listeners
          }
        }

        expectTypeOf(new CustomSubscribable().getListeners()).toEqualTypeOf<
          Set<(value: number) => void>
        >()
      })

      it('should stay writable inside the class', () => {
        class CustomSubscribable extends Subscribable<() => void> {
          replaceListeners() {
            this.listeners = new Set<() => void>()
          }
        }

        expectTypeOf<CustomSubscribable['replaceListeners']>().toEqualTypeOf<
          () => void
        >()
      })
    })

    describe('onSubscribe', () => {
      it('should not be accessible from outside the class', () => {
        const subscribable = new Subscribable<() => void>()

        // @ts-expect-error onSubscribe is protected
        subscribable.onSubscribe()

        expectTypeOf(subscribable).not.toHaveProperty('onSubscribe')
      })

      it('should take no argument and return void inside the class', () => {
        class CustomSubscribable extends Subscribable<() => void> {
          protected override onSubscribe(): void {
            expectTypeOf(super.onSubscribe).parameters.toEqualTypeOf<[]>()
            expectTypeOf(super.onSubscribe).returns.toEqualTypeOf<void>()
          }
        }

        expectTypeOf(
          new CustomSubscribable(),
        ).toEqualTypeOf<CustomSubscribable>()
      })
    })

    describe('onUnsubscribe', () => {
      it('should not be accessible from outside the class', () => {
        const subscribable = new Subscribable<() => void>()

        // @ts-expect-error onUnsubscribe is protected
        subscribable.onUnsubscribe()

        expectTypeOf(subscribable).not.toHaveProperty('onUnsubscribe')
      })

      it('should take no argument and return void inside the class', () => {
        class CustomSubscribable extends Subscribable<() => void> {
          protected override onUnsubscribe(): void {
            expectTypeOf(super.onUnsubscribe).parameters.toEqualTypeOf<[]>()
            expectTypeOf(super.onUnsubscribe).returns.toEqualTypeOf<void>()
          }
        }

        expectTypeOf(
          new CustomSubscribable(),
        ).toEqualTypeOf<CustomSubscribable>()
      })
    })
  })
})

import { afterEach, beforeEach, describe, expectTypeOf, it } from 'vitest'
import { MutationCache, QueryClient } from '..'
import type {
  DefaultError,
  Mutation,
  MutationCacheConfig,
  MutationCacheNotifyEvent,
  MutationFilters,
  MutationFunctionContext,
  MutationObserver,
  MutationState,
} from '..'

class CustomError extends Error {
  name = 'CustomError' as const
}

describe('mutationCache', () => {
  let queryClient: QueryClient
  let mutationCache: MutationCache

  beforeEach(() => {
    queryClient = new QueryClient()
    queryClient.mount()
    mutationCache = queryClient.getMutationCache()
  })

  afterEach(() => {
    queryClient.clear()
  })

  describe('MutationCache', () => {
    it('should only expose its documented members', () => {
      expectTypeOf<keyof MutationCache>().toEqualTypeOf<
        | 'subscribe'
        | 'hasListeners'
        | 'config'
        | 'build'
        | 'add'
        | 'remove'
        | 'canRun'
        | 'runNext'
        | 'clear'
        | 'getAll'
        | 'find'
        | 'findAll'
        | 'notify'
        | 'resumePausedMutations'
      >()
    })
  })

  describe('config', () => {
    it('should be typed as the cache config', () => {
      expectTypeOf(mutationCache.config).toEqualTypeOf<MutationCacheConfig>()
      expectTypeOf(
        new MutationCache().config,
      ).toEqualTypeOf<MutationCacheConfig>()
    })

    it('should stay writable', () => {
      type Config = Pick<MutationCache, 'config'>

      expectTypeOf<Config>().toEqualTypeOf<{
        -readonly [K in keyof Config]: Config[K]
      }>()
    })

    it('should be optional when constructing a cache', () => {
      expectTypeOf(MutationCache).constructorParameters.toEqualTypeOf<
        [config?: MutationCacheConfig]
      >()
    })
  })

  describe('MutationCacheConfig', () => {
    it('should declare exactly its four callbacks', () => {
      expectTypeOf<keyof MutationCacheConfig>().toEqualTypeOf<
        'onError' | 'onSuccess' | 'onMutate' | 'onSettled'
      >()
    })

    it('should declare every callback as optional', () => {
      type OptionalKeys = {
        [K in keyof MutationCacheConfig]-?: {} extends Pick<
          MutationCacheConfig,
          K
        >
          ? K
          : never
      }[keyof MutationCacheConfig]

      expectTypeOf<OptionalKeys>().toEqualTypeOf<keyof MutationCacheConfig>()
    })

    describe('onError', () => {
      it('should take the error, variables, onMutateResult, mutation and context, and return an unknown value', () => {
        expectTypeOf<
          NonNullable<MutationCacheConfig['onError']>
        >().returns.toEqualTypeOf<unknown>()
        expectTypeOf<
          NonNullable<MutationCacheConfig['onError']>
        >().parameters.toEqualTypeOf<
          [
            error: DefaultError,
            variables: unknown,
            onMutateResult: unknown,
            mutation: Mutation<unknown, unknown, unknown>,
            context: MutationFunctionContext,
          ]
        >()
      })
    })

    describe('onSuccess', () => {
      it('should take the data, variables, onMutateResult, mutation and context, and return an unknown value', () => {
        expectTypeOf<
          NonNullable<MutationCacheConfig['onSuccess']>
        >().returns.toEqualTypeOf<unknown>()
        expectTypeOf<
          NonNullable<MutationCacheConfig['onSuccess']>
        >().parameters.toEqualTypeOf<
          [
            data: unknown,
            variables: unknown,
            onMutateResult: unknown,
            mutation: Mutation<unknown, unknown, unknown>,
            context: MutationFunctionContext,
          ]
        >()
      })
    })

    describe('onMutate', () => {
      it('should take only the variables, mutation and context, and return an unknown value', () => {
        expectTypeOf<
          NonNullable<MutationCacheConfig['onMutate']>
        >().returns.toEqualTypeOf<unknown>()
        expectTypeOf<
          NonNullable<MutationCacheConfig['onMutate']>
        >().parameters.toEqualTypeOf<
          [
            variables: unknown,
            mutation: Mutation<unknown, unknown, unknown>,
            context: MutationFunctionContext,
          ]
        >()
      })
    })

    describe('onSettled', () => {
      it('should take the data, error, variables, onMutateResult, mutation and context, and return an unknown value', () => {
        expectTypeOf<
          NonNullable<MutationCacheConfig['onSettled']>
        >().returns.toEqualTypeOf<unknown>()
        expectTypeOf<
          NonNullable<MutationCacheConfig['onSettled']>
        >().parameters.toEqualTypeOf<
          [
            data: unknown,
            error: DefaultError | null,
            variables: unknown,
            onMutateResult: unknown,
            mutation: Mutation<unknown, unknown, unknown>,
            context: MutationFunctionContext,
          ]
        >()
      })
    })
  })

  describe('MutationCacheNotifyEvent', () => {
    it('should union exactly the six event type literals', () => {
      expectTypeOf<MutationCacheNotifyEvent['type']>().toEqualTypeOf<
        | 'added'
        | 'removed'
        | 'observerAdded'
        | 'observerRemoved'
        | 'observerOptionsUpdated'
        | 'updated'
      >()
    })

    it('should declare an optional mutation only on the observerOptionsUpdated event', () => {
      type OptionsUpdated = Extract<
        MutationCacheNotifyEvent,
        { type: 'observerOptionsUpdated' }
      >

      expectTypeOf<keyof OptionsUpdated>().toEqualTypeOf<
        'type' | 'mutation' | 'observer'
      >()
      expectTypeOf<OptionsUpdated['mutation']>().toEqualTypeOf<
        Mutation<any, any, any, any> | undefined
      >()
      expectTypeOf<OptionsUpdated['observer']>().toEqualTypeOf<
        MutationObserver<any, any, any, any>
      >()
    })

    it('should declare only a mutation on the added event', () => {
      type Added = Extract<MutationCacheNotifyEvent, { type: 'added' }>

      expectTypeOf<keyof Added>().toEqualTypeOf<'type' | 'mutation'>()
      expectTypeOf<Added['mutation']>().toEqualTypeOf<
        Mutation<any, any, any, any>
      >()
    })

    it('should declare only a mutation on the removed event', () => {
      expectTypeOf<
        keyof Extract<MutationCacheNotifyEvent, { type: 'removed' }>
      >().toEqualTypeOf<'type' | 'mutation'>()
    })

    it('should carry an action on the updated event', () => {
      expectTypeOf<
        keyof Extract<MutationCacheNotifyEvent, { type: 'updated' }>
      >().toEqualTypeOf<'type' | 'mutation' | 'action'>()
    })

    it('should carry an observer on the observerAdded event', () => {
      expectTypeOf<
        keyof Extract<MutationCacheNotifyEvent, { type: 'observerAdded' }>
      >().toEqualTypeOf<'type' | 'mutation' | 'observer'>()
      expectTypeOf<
        Extract<MutationCacheNotifyEvent, { type: 'observerAdded' }>['observer']
      >().toEqualTypeOf<MutationObserver<any, any, any>>()
    })

    it('should carry an observer on the observerRemoved event', () => {
      expectTypeOf<
        keyof Extract<MutationCacheNotifyEvent, { type: 'observerRemoved' }>
      >().toEqualTypeOf<'type' | 'mutation' | 'observer'>()
      expectTypeOf<
        Extract<
          MutationCacheNotifyEvent,
          { type: 'observerRemoved' }
        >['observer']
      >().toEqualTypeOf<MutationObserver<any, any, any>>()
    })

    it('should require the mutation on every event except observerOptionsUpdated', () => {
      type EventsWithRequiredMutation = Extract<
        MutationCacheNotifyEvent,
        { mutation: Mutation<any, any, any, any> }
      >['type']

      expectTypeOf<EventsWithRequiredMutation>().toEqualTypeOf<
        'added' | 'removed' | 'observerAdded' | 'observerRemoved' | 'updated'
      >()
    })
  })

  describe('subscribe', () => {
    it('should type the event given to a listener', () => {
      mutationCache.subscribe((event) => {
        expectTypeOf(event).toEqualTypeOf<MutationCacheNotifyEvent>()
      })
    })

    it('should return an unsubscribe function', () => {
      expectTypeOf(mutationCache.subscribe(() => {})).toEqualTypeOf<
        () => void
      >()
    })
  })

  describe('build', () => {
    it('should carry its type parameters into the mutation it returns', () => {
      const mutation = mutationCache.build<
        { value: string },
        CustomError,
        number,
        string
      >(queryClient, {
        mutationFn: (variables) => {
          expectTypeOf(variables).toEqualTypeOf<number>()
          return Promise.resolve({ value: 'data' })
        },
      })

      expectTypeOf(mutation).toEqualTypeOf<
        Mutation<{ value: string }, CustomError, number, string>
      >()
      expectTypeOf(mutation.state).toEqualTypeOf<
        MutationState<{ value: string }, CustomError, number, string>
      >()
    })

    it('should accept an optional initial state', () => {
      expectTypeOf(
        mutationCache.build<{ value: string }, CustomError, number, string>,
      )
        .parameter(2)
        .toEqualTypeOf<
          | MutationState<{ value: string }, CustomError, number, string>
          | undefined
        >()
    })
  })

  describe('getAll', () => {
    it('should return an array of fully defaulted mutations', () => {
      const all = mutationCache.getAll()

      expectTypeOf(all).toBeArray()
      expectTypeOf(all[0]!.state).toEqualTypeOf<
        MutationState<unknown, DefaultError, unknown, unknown>
      >()
      expectTypeOf(all[0]!.state.data).toEqualTypeOf<unknown>()
      expectTypeOf(all[0]!.state.error).toEqualTypeOf<DefaultError | null>()
    })

    it('should take no arguments', () => {
      expectTypeOf(mutationCache.getAll).parameters.toEqualTypeOf<[]>()
    })
  })

  describe('find', () => {
    it('should carry its type parameters into the mutation it returns', () => {
      expectTypeOf(
        mutationCache.find<{ value: string }, CustomError, number, string>({
          mutationKey: ['a'],
        }),
      ).toEqualTypeOf<
        Mutation<{ value: string }, CustomError, number, string> | undefined
      >()
    })

    it('should default its variables type parameter to any', () => {
      expectTypeOf(mutationCache.find({ mutationKey: ['a'] })).toEqualTypeOf<
        Mutation<unknown, DefaultError, any, unknown> | undefined
      >()
    })

    it('should only accept mutation filters', () => {
      expectTypeOf(mutationCache.find).parameters.toEqualTypeOf<
        [filters: MutationFilters]
      >()
    })
  })

  describe('findAll', () => {
    it('should return an array of fully defaulted mutations', () => {
      const found = mutationCache.findAll({ mutationKey: ['a'] })

      expectTypeOf(found).toBeArray()
      expectTypeOf(found[0]!.state).toEqualTypeOf<
        MutationState<unknown, DefaultError, unknown, unknown>
      >()
    })

    it('should accept filters or nothing', () => {
      mutationCache.findAll()
      mutationCache.findAll({ status: 'pending' })
      // @ts-expect-error status must be a mutation status
      mutationCache.findAll({ status: 'nope' })

      expectTypeOf(mutationCache.findAll).parameters.toEqualTypeOf<
        [filters?: MutationFilters]
      >()
    })
  })

  describe('add', () => {
    it('should take a single mutation and return void', () => {
      expectTypeOf(mutationCache.add).returns.toEqualTypeOf<void>()
      expectTypeOf(mutationCache.add).parameters.toEqualTypeOf<
        [mutation: Mutation<any, any, any, any>]
      >()
    })
  })

  describe('remove', () => {
    it('should take a single mutation and return void', () => {
      expectTypeOf(mutationCache.remove).returns.toEqualTypeOf<void>()
      expectTypeOf(mutationCache.remove).parameters.toEqualTypeOf<
        [mutation: Mutation<any, any, any, any>]
      >()
    })
  })

  describe('canRun', () => {
    it('should return a boolean for a single mutation', () => {
      expectTypeOf(mutationCache.canRun).returns.toEqualTypeOf<boolean>()
      expectTypeOf(mutationCache.canRun).parameters.toEqualTypeOf<
        [mutation: Mutation<any, any, any, any>]
      >()
    })
  })

  describe('runNext', () => {
    it('should resolve with an unknown value', () => {
      expectTypeOf(mutationCache.runNext).returns.toEqualTypeOf<
        Promise<unknown>
      >()
      expectTypeOf(mutationCache.runNext).parameters.toEqualTypeOf<
        [mutation: Mutation<any, any, any, any>]
      >()
    })
  })

  describe('clear', () => {
    it('should take no arguments and return void', () => {
      expectTypeOf(mutationCache.clear).parameters.toEqualTypeOf<[]>()
      expectTypeOf(mutationCache.clear).returns.toEqualTypeOf<void>()
    })
  })

  describe('notify', () => {
    it('should only accept a notify event and return void', () => {
      expectTypeOf(mutationCache.notify).parameters.toEqualTypeOf<
        [event: MutationCacheNotifyEvent]
      >()
      expectTypeOf(mutationCache.notify).returns.toEqualTypeOf<void>()
    })
  })

  describe('resumePausedMutations', () => {
    it('should take no arguments and resolve with an unknown value', () => {
      expectTypeOf(
        mutationCache.resumePausedMutations,
      ).parameters.toEqualTypeOf<[]>()
      expectTypeOf(mutationCache.resumePausedMutations).returns.toEqualTypeOf<
        Promise<unknown>
      >()
    })
  })
})

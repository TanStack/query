import { afterEach, beforeEach, describe, expectTypeOf, it } from 'vitest'
import { MutationObserver, QueryClient } from '..'
import type { Action } from '../mutation'
import type {
  DefaultError,
  MutateFunction,
  MutateOptions,
  MutationFunctionContext,
  MutationKey,
  MutationMeta,
  MutationObserverBaseResult,
  MutationObserverErrorResult,
  MutationObserverIdleResult,
  MutationObserverLoadingResult,
  MutationObserverOptions,
  MutationObserverResult,
  MutationObserverSuccessResult,
  MutationState,
} from '..'

class CustomError extends Error {
  name = 'CustomError' as const
}

type Variables = { title: string }
type Data = { id: number }
type OnMutateResult = { previous: string }

describe('mutationObserver', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
  })

  describe('MutationObserver', () => {
    it('should only expose its documented members', () => {
      expectTypeOf<keyof MutationObserver>().toEqualTypeOf<
        | 'subscribe'
        | 'hasListeners'
        | 'options'
        | 'setOptions'
        | 'onMutationUpdate'
        | 'getCurrentResult'
        | 'reset'
        | 'mutate'
      >()
    })
  })

  describe('MutationObserverOptions', () => {
    it('should keep every option writable', () => {
      type Options = MutationObserverOptions<
        Data,
        CustomError,
        Variables,
        OnMutateResult
      >

      expectTypeOf<Options>().toEqualTypeOf<{
        -readonly [K in keyof Options]: Options[K]
      }>()
    })

    describe('mutationFn', () => {
      it('should take the variables and return a promise of the data', () => {
        expectTypeOf<
          NonNullable<
            MutationObserverOptions<Data, CustomError, Variables>['mutationFn']
          >
        >().toEqualTypeOf<
          (
            variables: Variables,
            context: MutationFunctionContext,
          ) => Promise<Data>
        >()
      })

      it('should reject a synchronously returned data', () => {
        new MutationObserver<Data, CustomError, Variables>(queryClient, {
          // @ts-expect-error the mutationFn must return a promise
          mutationFn: (variables) => ({ id: variables.title.length }),
        })

        const observer = new MutationObserver<Data, CustomError, Variables>(
          queryClient,
          {
            mutationFn: (variables) =>
              Promise.resolve({ id: variables.title.length }),
          },
        )

        expectTypeOf(observer).toEqualTypeOf<
          MutationObserver<Data, CustomError, Variables, unknown>
        >()
      })
    })

    describe('mutationKey', () => {
      it('should be an optional mutation key', () => {
        expectTypeOf<
          MutationObserverOptions<Data, CustomError, Variables>['mutationKey']
        >().toEqualTypeOf<ReadonlyArray<unknown> | undefined>()
      })
    })

    describe('onMutate', () => {
      it('should take the variables and return the on-mutate result', () => {
        expectTypeOf<
          NonNullable<
            MutationObserverOptions<
              Data,
              CustomError,
              Variables,
              OnMutateResult
            >['onMutate']
          >
        >().toEqualTypeOf<
          (
            variables: Variables,
            context: MutationFunctionContext,
          ) => Promise<OnMutateResult> | OnMutateResult
        >()
      })
    })

    describe('onSuccess', () => {
      it('should take the on-mutate result without undefined', () => {
        expectTypeOf<
          NonNullable<
            MutationObserverOptions<
              Data,
              CustomError,
              Variables,
              OnMutateResult
            >['onSuccess']
          >
        >()
          .parameter(2)
          .toEqualTypeOf<OnMutateResult>()
      })

      it('should take the data, the variables and the mutation function context', () => {
        expectTypeOf<
          NonNullable<
            MutationObserverOptions<
              Data,
              CustomError,
              Variables,
              OnMutateResult
            >['onSuccess']
          >
        >().toEqualTypeOf<
          (
            data: Data,
            variables: Variables,
            onMutateResult: OnMutateResult,
            context: MutationFunctionContext,
          ) => Promise<unknown> | unknown
        >()
      })
    })

    describe('onError', () => {
      it('should take the on-mutate result as possibly undefined', () => {
        expectTypeOf<
          NonNullable<
            MutationObserverOptions<
              Data,
              CustomError,
              Variables,
              OnMutateResult
            >['onError']
          >
        >()
          .parameter(2)
          .toEqualTypeOf<OnMutateResult | undefined>()
      })

      it('should take the error without null and return unknown', () => {
        type OnError = NonNullable<
          MutationObserverOptions<
            Data,
            CustomError,
            Variables,
            OnMutateResult
          >['onError']
        >

        expectTypeOf<OnError>().parameter(0).toEqualTypeOf<CustomError>()
        expectTypeOf<OnError>().returns.toEqualTypeOf<unknown>()
      })
    })

    describe('onSettled', () => {
      it('should take the data and the error as nullable and return unknown', () => {
        type OnSettled = NonNullable<
          MutationObserverOptions<
            Data,
            CustomError,
            Variables,
            OnMutateResult
          >['onSettled']
        >

        expectTypeOf<OnSettled>().parameter(0).toEqualTypeOf<Data | undefined>()
        expectTypeOf<OnSettled>()
          .parameter(1)
          .toEqualTypeOf<CustomError | null>()
        expectTypeOf<OnSettled>().returns.toEqualTypeOf<unknown>()
      })

      it('should take the on-mutate result as possibly undefined', () => {
        expectTypeOf<
          NonNullable<
            MutationObserverOptions<
              Data,
              CustomError,
              Variables,
              OnMutateResult
            >['onSettled']
          >
        >()
          .parameter(3)
          .toEqualTypeOf<OnMutateResult | undefined>()
      })
    })

    describe('throwOnError', () => {
      it('should be a boolean or a predicate taking the error', () => {
        expectTypeOf<
          MutationObserverOptions<Data, CustomError, Variables>['throwOnError']
        >().toEqualTypeOf<
          boolean | ((error: CustomError) => boolean) | undefined
        >()
      })
    })

    describe('meta', () => {
      it('should be optional mutation meta', () => {
        expectTypeOf<
          MutationObserverOptions<Data, CustomError, Variables>['meta']
        >().toEqualTypeOf<MutationMeta | undefined>()
      })
    })
  })

  describe('constructor', () => {
    it('should default its type parameters', () => {
      const observer = new MutationObserver(queryClient, {})

      expectTypeOf(observer).toEqualTypeOf<
        MutationObserver<unknown, DefaultError, void, unknown>
      >()
    })

    it('should take the query client as its first argument', () => {
      expectTypeOf<
        ConstructorParameters<
          typeof MutationObserver<Data, CustomError, Variables, OnMutateResult>
        >[0]
      >().toEqualTypeOf<QueryClient>()
    })

    it('should infer the on-mutate result from onMutate', () => {
      const observer = new MutationObserver(queryClient, {
        mutationFn: (variables: Variables) =>
          Promise.resolve({ id: variables.title.length }),
        onMutate: () => ({ previous: 'value' }),
      })

      expectTypeOf(observer).toEqualTypeOf<
        MutationObserver<Data, DefaultError, Variables, OnMutateResult>
      >()
    })

    it('should flow the on-mutate result into the settled callbacks', () => {
      new MutationObserver(queryClient, {
        mutationFn: (variables: Variables) =>
          Promise.resolve({ id: variables.title.length }),
        onMutate: () => ({ previous: 'value' }),
        onSuccess: (data, variables, onMutateResult) => {
          expectTypeOf(data).toEqualTypeOf<Data>()
          expectTypeOf(variables).toEqualTypeOf<Variables>()
          expectTypeOf(onMutateResult).toEqualTypeOf<OnMutateResult>()
        },
        onError: (error, variables, onMutateResult) => {
          expectTypeOf(error).toEqualTypeOf<DefaultError>()
          expectTypeOf(variables).toEqualTypeOf<Variables>()
          expectTypeOf(onMutateResult).toEqualTypeOf<
            OnMutateResult | undefined
          >()
        },
        onSettled: (data, error, variables, onMutateResult) => {
          expectTypeOf(data).toEqualTypeOf<Data | undefined>()
          expectTypeOf(error).toEqualTypeOf<DefaultError | null>()
          expectTypeOf(variables).toEqualTypeOf<Variables>()
          expectTypeOf(onMutateResult).toEqualTypeOf<
            OnMutateResult | undefined
          >()
        },
      })
    })

    it('should infer the on-mutate result as undefined when onMutate returns it explicitly', () => {
      new MutationObserver(queryClient, {
        mutationFn: (variables: number) => Promise.resolve(String(variables)),
        onMutate: () => {
          return undefined
        },
        onSuccess: (data, variables, onMutateResult) => {
          expectTypeOf(data).toEqualTypeOf<string>()
          expectTypeOf(variables).toEqualTypeOf<number>()
          expectTypeOf(onMutateResult).toEqualTypeOf<undefined>()
        },
        onError: (_error, _variables, onMutateResult) => {
          expectTypeOf(onMutateResult).toEqualTypeOf<undefined>()
        },
        onSettled: (_data, _error, _variables, onMutateResult) => {
          expectTypeOf(onMutateResult).toEqualTypeOf<undefined>()
        },
      })
    })

    it('should infer the on-mutate result as unknown when onMutate is left out', () => {
      new MutationObserver(queryClient, {
        mutationFn: (variables: number) => Promise.resolve(String(variables)),
        onSuccess: (_data, _variables, onMutateResult) => {
          expectTypeOf(onMutateResult).toEqualTypeOf<unknown>()
        },
        onError: (_error, _variables, onMutateResult) => {
          expectTypeOf(onMutateResult).toEqualTypeOf<unknown>()
        },
        onSettled: (_data, _error, _variables, onMutateResult) => {
          expectTypeOf(onMutateResult).toEqualTypeOf<unknown>()
        },
      })
    })

    it('should keep undefined in the on-mutate result union when onMutate may return it', () => {
      new MutationObserver(queryClient, {
        mutationFn: (variables: number) => Promise.resolve(String(variables)),
        onMutate: () => {
          return Math.random() > 0.5 ? { foo: 'bar' } : undefined
        },
        onSuccess: (_data, _variables, onMutateResult) => {
          expectTypeOf(onMutateResult).toEqualTypeOf<
            { foo: string } | undefined
          >()
        },
        onError: (_error, _variables, onMutateResult) => {
          expectTypeOf(onMutateResult).toEqualTypeOf<
            { foo: string } | undefined
          >()
        },
        onSettled: (_data, _error, _variables, onMutateResult) => {
          expectTypeOf(onMutateResult).toEqualTypeOf<
            { foo: string } | undefined
          >()
        },
      })
    })

    it('should require the options argument', () => {
      expectTypeOf<
        ConstructorParameters<
          typeof MutationObserver<Data, CustomError, Variables, OnMutateResult>
        >['length']
      >().toEqualTypeOf<2>()
    })
  })

  describe('options', () => {
    it('should expose the observed types through the options it holds', () => {
      const observer = new MutationObserver<
        Data,
        CustomError,
        Variables,
        OnMutateResult
      >(queryClient, {})

      expectTypeOf(observer.options).toEqualTypeOf<
        MutationObserverOptions<Data, CustomError, Variables, OnMutateResult>
      >()
    })

    it('should stay writable', () => {
      type Options = Pick<MutationObserver, 'options'>

      expectTypeOf<Options>().toEqualTypeOf<{
        -readonly [K in keyof Options]: Options[K]
      }>()
    })
  })

  describe('setOptions', () => {
    it('should take the observer options', () => {
      const observer = new MutationObserver<
        Data,
        CustomError,
        Variables,
        OnMutateResult
      >(queryClient, {})

      expectTypeOf(observer.setOptions)
        .parameter(0)
        .toEqualTypeOf<
          MutationObserverOptions<Data, CustomError, Variables, OnMutateResult>
        >()
    })

    it('should take exactly the options argument', () => {
      expectTypeOf<
        Parameters<MutationObserver['setOptions']>['length']
      >().toEqualTypeOf<1>()
    })

    it('should reject a mutationFn returning another data type', () => {
      const observer = new MutationObserver<Data, CustomError, Variables>(
        queryClient,
        {},
      )

      observer.setOptions({
        // @ts-expect-error the mutationFn must resolve to the observed data type
        mutationFn: () => Promise.resolve('nope'),
      })

      expectTypeOf(
        observer.setOptions({
          mutationFn: (variables) =>
            Promise.resolve({ id: variables.title.length }),
        }),
      ).toEqualTypeOf<void>()
    })
  })

  describe('getCurrentResult', () => {
    it('should return the observer result', () => {
      const observer = new MutationObserver<
        Data,
        CustomError,
        Variables,
        OnMutateResult
      >(queryClient, {})

      expectTypeOf(observer.getCurrentResult()).toEqualTypeOf<
        MutationObserverResult<Data, CustomError, Variables, OnMutateResult>
      >()
    })

    it('should take no arguments', () => {
      expectTypeOf<
        Parameters<MutationObserver['getCurrentResult']>
      >().toEqualTypeOf<[]>()
    })
  })

  describe('mutate', () => {
    it('should take the variables and return a promise of the data', () => {
      const observer = new MutationObserver<
        Data,
        CustomError,
        Variables,
        OnMutateResult
      >(queryClient, {})

      expectTypeOf(observer.mutate).parameter(0).toEqualTypeOf<Variables>()
      expectTypeOf(observer.mutate).returns.toEqualTypeOf<Promise<Data>>()
    })

    it('should take the variables and the optional mutate options', () => {
      const observer = new MutationObserver<
        Data,
        CustomError,
        Variables,
        OnMutateResult
      >(queryClient, {})

      expectTypeOf<Parameters<typeof observer.mutate>>().toEqualTypeOf<
        [
          variables: Variables,
          options?: MutateOptions<Data, CustomError, Variables, OnMutateResult>,
        ]
      >()
    })

    it('should let void variables be omitted at the call site', () => {
      const observer = new MutationObserver(queryClient, {})

      expectTypeOf(observer.mutate()).toEqualTypeOf<Promise<unknown>>()
      expectTypeOf(observer.mutate(undefined)).toEqualTypeOf<Promise<unknown>>()

      const result = observer.getCurrentResult()

      expectTypeOf(result.mutate()).toEqualTypeOf<Promise<unknown>>()
    })

    it('should take optional per-call mutate options', () => {
      const observer = new MutationObserver<
        Data,
        CustomError,
        Variables,
        OnMutateResult
      >(queryClient, {})

      expectTypeOf(observer.mutate)
        .parameter(1)
        .toEqualTypeOf<
          | MutateOptions<Data, CustomError, Variables, OnMutateResult>
          | undefined
        >()
    })

    it('should type the per-call callbacks it is given', () => {
      const observer = new MutationObserver<
        Data,
        CustomError,
        Variables,
        OnMutateResult
      >(queryClient, {})

      observer.mutate(
        { title: 'title' },
        {
          onSuccess: (data, variables, onMutateResult, context) => {
            expectTypeOf(data).toEqualTypeOf<Data>()
            expectTypeOf(variables).toEqualTypeOf<Variables>()
            expectTypeOf(onMutateResult).toEqualTypeOf<
              OnMutateResult | undefined
            >()
            expectTypeOf(context).toEqualTypeOf<MutationFunctionContext>()
          },
          onError: (error, _variables, onMutateResult) => {
            expectTypeOf(error).toEqualTypeOf<CustomError>()
            expectTypeOf(onMutateResult).toEqualTypeOf<
              OnMutateResult | undefined
            >()
          },
          onSettled: (data, error, _variables, onMutateResult) => {
            expectTypeOf(data).toEqualTypeOf<Data | undefined>()
            expectTypeOf(error).toEqualTypeOf<CustomError | null>()
            expectTypeOf(onMutateResult).toEqualTypeOf<
              OnMutateResult | undefined
            >()
          },
        },
      )
    })

    it('should reject variables of another type', () => {
      const observer = new MutationObserver<
        Data,
        CustomError,
        Variables,
        OnMutateResult
      >(queryClient, {})

      // @ts-expect-error the variables must match the observed variables type
      observer.mutate({ title: 42 })

      expectTypeOf(observer.mutate({ title: 'title' })).toEqualTypeOf<
        Promise<Data>
      >()
    })
  })

  describe('reset', () => {
    it('should take no arguments and return nothing', () => {
      expectTypeOf<Parameters<MutationObserver['reset']>>().toEqualTypeOf<[]>()
      expectTypeOf<
        ReturnType<MutationObserver['reset']>
      >().toEqualTypeOf<void>()
    })
  })

  describe('onMutationUpdate', () => {
    it('should take the action of the mutation it observes', () => {
      const observer = new MutationObserver<
        Data,
        CustomError,
        Variables,
        OnMutateResult
      >(queryClient, {})

      expectTypeOf(observer.onMutationUpdate)
        .parameter(0)
        .toEqualTypeOf<Action<Data, CustomError, Variables, OnMutateResult>>()
    })

    it('should return nothing', () => {
      expectTypeOf<
        ReturnType<MutationObserver['onMutationUpdate']>
      >().toEqualTypeOf<void>()
    })
  })

  describe('subscribe', () => {
    it('should take a listener receiving the observer result', () => {
      const observer = new MutationObserver<
        Data,
        CustomError,
        Variables,
        OnMutateResult
      >(queryClient, {})

      expectTypeOf(observer.subscribe)
        .parameter(0)
        .parameter(0)
        .toEqualTypeOf<
          MutationObserverResult<Data, CustomError, Variables, OnMutateResult>
        >()
    })

    it('should take a listener returning nothing', () => {
      expectTypeOf<MutationObserver['subscribe']>()
        .parameter(0)
        .returns.toEqualTypeOf<void>()
    })

    it('should return a function that unsubscribes', () => {
      expectTypeOf<ReturnType<MutationObserver['subscribe']>>().toEqualTypeOf<
        () => void
      >()
    })
  })

  describe('hasListeners', () => {
    it('should return whether the observer is subscribed to', () => {
      const observer = new MutationObserver(queryClient, {})

      expectTypeOf(observer.hasListeners()).toEqualTypeOf<boolean>()
    })
  })

  describe('MutationObserverResult', () => {
    describe('MutationObserverBaseResult', () => {
      it('should keep every property writable', () => {
        type Base = MutationObserverBaseResult<
          Data,
          CustomError,
          Variables,
          OnMutateResult
        >

        expectTypeOf<Base>().toEqualTypeOf<{
          -readonly [K in keyof Base]: Base[K]
        }>()
      })

      describe('data', () => {
        it('should be the data or undefined', () => {
          expectTypeOf<
            MutationObserverBaseResult<
              Data,
              CustomError,
              Variables,
              OnMutateResult
            >['data']
          >().toEqualTypeOf<Data | undefined>()
        })
      })

      describe('error', () => {
        it('should be the error or null', () => {
          expectTypeOf<
            MutationObserverBaseResult<
              Data,
              CustomError,
              Variables,
              OnMutateResult
            >['error']
          >().toEqualTypeOf<CustomError | null>()
        })
      })

      describe('variables', () => {
        it('should be the variables or undefined', () => {
          expectTypeOf<
            MutationObserverBaseResult<
              Data,
              CustomError,
              Variables,
              OnMutateResult
            >['variables']
          >().toEqualTypeOf<Variables | undefined>()
        })
      })

      describe('MutationState', () => {
        it('should inherit the members it does not redeclare', () => {
          type Inherited =
            | 'context'
            | 'failureCount'
            | 'failureReason'
            | 'isPaused'
            | 'submittedAt'

          expectTypeOf<
            Pick<
              MutationObserverBaseResult<
                Data,
                CustomError,
                Variables,
                OnMutateResult
              >,
              Inherited
            >
          >().toEqualTypeOf<
            Pick<
              MutationState<Data, CustomError, Variables, OnMutateResult>,
              Inherited
            >
          >()
        })
      })

      describe('status', () => {
        it('should be the mutation status', () => {
          expectTypeOf<
            MutationObserverBaseResult<Data, CustomError>['status']
          >().toEqualTypeOf<'idle' | 'pending' | 'success' | 'error'>()
        })
      })

      describe('isIdle', () => {
        it('should be a boolean on the base result', () => {
          expectTypeOf<
            MutationObserverBaseResult<Data, CustomError>['isIdle']
          >().toEqualTypeOf<boolean>()
        })
      })

      describe('isPending', () => {
        it('should be a boolean on the base result', () => {
          expectTypeOf<
            MutationObserverBaseResult<Data, CustomError>['isPending']
          >().toEqualTypeOf<boolean>()
        })
      })

      describe('isError', () => {
        it('should be a boolean on the base result', () => {
          expectTypeOf<
            MutationObserverBaseResult<Data, CustomError>['isError']
          >().toEqualTypeOf<boolean>()
        })
      })

      describe('isSuccess', () => {
        it('should be a boolean on the base result', () => {
          expectTypeOf<
            MutationObserverBaseResult<Data, CustomError>['isSuccess']
          >().toEqualTypeOf<boolean>()
        })
      })

      describe('reset', () => {
        it('should take no arguments and return nothing', () => {
          expectTypeOf<
            MutationObserverBaseResult<Data, CustomError>['reset']
          >().toEqualTypeOf<() => void>()
        })
      })

      describe('mutate', () => {
        it('should be the mutate function', () => {
          expectTypeOf<
            MutationObserverBaseResult<
              Data,
              CustomError,
              Variables,
              OnMutateResult
            >['mutate']
          >().toEqualTypeOf<
            MutateFunction<Data, CustomError, Variables, OnMutateResult>
          >()
        })
      })
    })

    describe('MutationObserverIdleResult', () => {
      it('should narrow every derived flag and the data', () => {
        type Idle = Extract<
          MutationObserverResult<Data, CustomError, Variables, OnMutateResult>,
          { status: 'idle' }
        >

        expectTypeOf<Idle['data']>().toEqualTypeOf<undefined>()
        expectTypeOf<Idle['error']>().toEqualTypeOf<null>()
        expectTypeOf<Idle['variables']>().toEqualTypeOf<undefined>()
        expectTypeOf<Idle['isIdle']>().toEqualTypeOf<true>()
        expectTypeOf<Idle['isPending']>().toEqualTypeOf<false>()
        expectTypeOf<Idle['isError']>().toEqualTypeOf<false>()
        expectTypeOf<Idle['isSuccess']>().toEqualTypeOf<false>()
      })

      it('should be reachable through the isIdle flag', () => {
        type Idle = Extract<
          MutationObserverResult<Data, CustomError, Variables, OnMutateResult>,
          { isIdle: true }
        >

        expectTypeOf<Idle['status']>().toEqualTypeOf<'idle'>()
      })

      it('should declare exactly the state, base and narrowed keys', () => {
        expectTypeOf<keyof MutationObserverIdleResult>().toEqualTypeOf<
          keyof MutationObserverBaseResult
        >()
      })
    })

    describe('MutationObserverLoadingResult', () => {
      it('should narrow every derived flag and the data', () => {
        type Loading = Extract<
          MutationObserverResult<Data, CustomError, Variables, OnMutateResult>,
          { status: 'pending' }
        >

        expectTypeOf<Loading['data']>().toEqualTypeOf<undefined>()
        expectTypeOf<Loading['error']>().toEqualTypeOf<null>()
        expectTypeOf<Loading['variables']>().toEqualTypeOf<Variables>()
        expectTypeOf<Loading['isIdle']>().toEqualTypeOf<false>()
        expectTypeOf<Loading['isPending']>().toEqualTypeOf<true>()
        expectTypeOf<Loading['isError']>().toEqualTypeOf<false>()
        expectTypeOf<Loading['isSuccess']>().toEqualTypeOf<false>()
      })

      it('should be reachable through the isPending flag', () => {
        type Loading = Extract<
          MutationObserverResult<Data, CustomError, Variables, OnMutateResult>,
          { isPending: true }
        >

        expectTypeOf<Loading['status']>().toEqualTypeOf<'pending'>()
      })

      it('should declare exactly the state, base and narrowed keys', () => {
        expectTypeOf<keyof MutationObserverLoadingResult>().toEqualTypeOf<
          keyof MutationObserverBaseResult
        >()
      })
    })

    describe('MutationObserverErrorResult', () => {
      it('should narrow every derived flag and the error', () => {
        type ErrorResult = Extract<
          MutationObserverResult<Data, CustomError, Variables, OnMutateResult>,
          { status: 'error' }
        >

        expectTypeOf<ErrorResult['data']>().toEqualTypeOf<undefined>()
        expectTypeOf<ErrorResult['error']>().toEqualTypeOf<CustomError>()
        expectTypeOf<ErrorResult['variables']>().toEqualTypeOf<Variables>()
        expectTypeOf<ErrorResult['isIdle']>().toEqualTypeOf<false>()
        expectTypeOf<ErrorResult['isPending']>().toEqualTypeOf<false>()
        expectTypeOf<ErrorResult['isError']>().toEqualTypeOf<true>()
        expectTypeOf<ErrorResult['isSuccess']>().toEqualTypeOf<false>()
      })

      it('should be reachable through the isError flag', () => {
        type ErrorResult = Extract<
          MutationObserverResult<Data, CustomError, Variables, OnMutateResult>,
          { isError: true }
        >

        expectTypeOf<ErrorResult['status']>().toEqualTypeOf<'error'>()
      })

      it('should declare exactly the state, base and narrowed keys', () => {
        expectTypeOf<keyof MutationObserverErrorResult>().toEqualTypeOf<
          keyof MutationObserverBaseResult
        >()
      })
    })

    describe('MutationObserverSuccessResult', () => {
      it('should narrow every derived flag and the data', () => {
        type Success = Extract<
          MutationObserverResult<Data, CustomError, Variables, OnMutateResult>,
          { status: 'success' }
        >

        expectTypeOf<Success['data']>().toEqualTypeOf<Data>()
        expectTypeOf<Success['error']>().toEqualTypeOf<null>()
        expectTypeOf<Success['variables']>().toEqualTypeOf<Variables>()
        expectTypeOf<Success['isIdle']>().toEqualTypeOf<false>()
        expectTypeOf<Success['isPending']>().toEqualTypeOf<false>()
        expectTypeOf<Success['isError']>().toEqualTypeOf<false>()
        expectTypeOf<Success['isSuccess']>().toEqualTypeOf<true>()
      })

      it('should be reachable through the isSuccess flag', () => {
        type Success = Extract<
          MutationObserverResult<Data, CustomError, Variables, OnMutateResult>,
          { isSuccess: true }
        >

        expectTypeOf<Success['status']>().toEqualTypeOf<'success'>()
      })

      it('should declare exactly the state, base and narrowed keys', () => {
        expectTypeOf<keyof MutationObserverSuccessResult>().toEqualTypeOf<
          keyof MutationObserverBaseResult
        >()
      })
    })

    it('should be made of exactly the four status branches', () => {
      type Result = MutationObserverResult<
        Data,
        CustomError,
        Variables,
        OnMutateResult
      >

      expectTypeOf<Result['status']>().toEqualTypeOf<
        'idle' | 'pending' | 'error' | 'success'
      >()
    })
  })

  describe('MutateOptions', () => {
    it('should keep every per-call option writable', () => {
      type Options = MutateOptions<Data, CustomError, Variables, OnMutateResult>

      expectTypeOf<Options>().toEqualTypeOf<{
        -readonly [K in keyof Options]: Options[K]
      }>()
    })

    describe('onSuccess', () => {
      it('should take the on-mutate result as possibly undefined and return nothing', () => {
        expectTypeOf<
          NonNullable<
            MutateOptions<
              Data,
              CustomError,
              Variables,
              OnMutateResult
            >['onSuccess']
          >
        >().toEqualTypeOf<
          (
            data: Data,
            variables: Variables,
            onMutateResult: OnMutateResult | undefined,
            context: MutationFunctionContext,
          ) => void
        >()
      })
    })

    describe('onError', () => {
      it('should take the error and return nothing', () => {
        expectTypeOf<
          NonNullable<
            MutateOptions<
              Data,
              CustomError,
              Variables,
              OnMutateResult
            >['onError']
          >
        >().toEqualTypeOf<
          (
            error: CustomError,
            variables: Variables,
            onMutateResult: OnMutateResult | undefined,
            context: MutationFunctionContext,
          ) => void
        >()
      })
    })

    describe('onSettled', () => {
      it('should take the nullable data and error and return nothing', () => {
        expectTypeOf<
          NonNullable<
            MutateOptions<
              Data,
              CustomError,
              Variables,
              OnMutateResult
            >['onSettled']
          >
        >().toEqualTypeOf<
          (
            data: Data | undefined,
            error: CustomError | null,
            variables: Variables,
            onMutateResult: OnMutateResult | undefined,
            context: MutationFunctionContext,
          ) => void
        >()
      })
    })
  })

  describe('MutationFunctionContext', () => {
    it('should carry the client, the meta and the mutation key', () => {
      expectTypeOf<MutationFunctionContext>().toEqualTypeOf<{
        client: QueryClient
        meta: MutationMeta | undefined
        mutationKey?: MutationKey
      }>()
    })
  })
})

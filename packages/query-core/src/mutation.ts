import type { MutationOptions, MutationStatus, MutationMeta } from './types'
import type { MutationCache } from './mutationCache'
import type { MutationObserver } from './mutationObserver'
import type { Logger } from './logger'
import { defaultLogger } from './logger'
import { notifyManager } from './notifyManager'
import { Removable } from './removable'
import type { Retryer } from './retryer'
import { canFetch, createRetryer } from './retryer'

// TYPES

interface MutationConfig<TData, TError, TVariables, TContext> {
  mutationId: number
  mutationCache: MutationCache
  options: MutationOptions<TData, TError, TVariables, TContext>
  logger?: Logger
  defaultOptions?: MutationOptions<TData, TError, TVariables, TContext>
  state?: MutationState<TData, TError, TVariables, TContext>
  meta?: MutationMeta
}

export interface MutationState<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
> {
  context: TContext | undefined
  data: TData | undefined
  error: TError | null
  failureCount: number
  failureReason: TError | null
  isPaused: boolean
  status: MutationStatus
  variables: TVariables | undefined
}

interface FailedAction<TError> {
  type: 'failed'
  failureCount: number
  error: TError | null
}

interface LoadingAction<TVariables, TContext> {
  type: 'loading'
  variables?: TVariables
  context?: TContext
}

interface SuccessAction<TData, TVariables> {
  type: 'success'
  data: TData
  variables: TVariables
}

interface ErrorAction<TError, TVariables> {
  type: 'error'
  error: TError
  variables: TVariables
}

interface PauseAction {
  type: 'pause'
}

interface ContinueAction {
  type: 'continue'
}

export type Action<TData, TError, TVariables, TContext> =
  | ContinueAction
  | ErrorAction<TError, TVariables>
  | FailedAction<TError>
  | LoadingAction<TVariables, TContext>
  | PauseAction
  | SuccessAction<TData, TVariables>

// CLASS

export class Mutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
> extends Removable {
  state: MutationState<TData, TError, TVariables, TContext>
  options: MutationOptions<TData, TError, TVariables, TContext>
  mutationId: number

  #observers: MutationObserver<TData, TError, TVariables, TContext>[]
  #mutationCache: MutationCache
  #logger: Logger
  #retryer?: Retryer<TData>

  constructor(config: MutationConfig<TData, TError, TVariables, TContext>) {
    super()

    this.options = {
      ...config.defaultOptions,
      ...config.options,
    }
    this.mutationId = config.mutationId
    this.#mutationCache = config.mutationCache
    this.#logger = config.logger || defaultLogger
    this.#observers = []
    this.state = config.state || getDefaultState()

    this.updateCacheTime(this.options.cacheTime)
    this.scheduleGc()
  }

  get meta(): MutationMeta | undefined {
    return this.options.meta
  }

  addObserver(observer: MutationObserver<any, any, any, any>): void {
    if (this.#observers.indexOf(observer) === -1) {
      this.#observers.push(observer)

      // Stop the mutation from being garbage collected
      this.clearGcTimeout()

      this.#mutationCache.notify({
        type: 'observerAdded',
        mutation: this,
        observer,
      })
    }
  }

  removeObserver(observer: MutationObserver<any, any, any, any>): void {
    this.#observers = this.#observers.filter((x) => x !== observer)

    this.scheduleGc()

    this.#mutationCache.notify({
      type: 'observerRemoved',
      mutation: this,
      observer,
    })
  }

  protected optionalRemove() {
    if (!this.#observers.length) {
      if (this.state.status === 'loading') {
        this.scheduleGc()
      } else {
        this.#mutationCache.remove(this)
      }
    }
  }

  continue(): Promise<TData> {
    if (this.#retryer) {
      this.#retryer.continue()
      return this.#retryer.promise
    }
    return this.execute()
  }

  async execute(input?: TVariables): Promise<TData> {
    const executeMutation = () => {
      this.#retryer = createRetryer({
        fn: () => {
          if (!this.options.mutationFn) {
            return Promise.reject('No mutationFn found')
          }
          return this.options.mutationFn(this.state.variables!)
        },
        onFail: (failureCount, error) => {
          this.#dispatch({ type: 'failed', failureCount, error })
        },
        onPause: () => {
          this.#dispatch({ type: 'pause' })
        },
        onContinue: () => {
          this.#dispatch({ type: 'continue' })
        },
        retry: this.options.retry ?? 0,
        retryDelay: this.options.retryDelay,
        networkMode: this.options.networkMode,
      })

      return this.#retryer.promise
    }

    const restored = this.state.status === 'loading'
    let variables: TVariables | undefined = input

    try {
      if (!restored) {
        this.#dispatch({ type: 'loading', variables })
        // Notify cache callback
        await this.#mutationCache.config.onMutate?.(
          variables,
          this as Mutation<unknown, unknown, unknown, unknown>,
        )
        const context = await this.options.onMutate?.(variables!)
        if (context !== this.state.context) {
          this.#dispatch({
            type: 'loading',
            context,
            variables,
          })
        }
      }
      // this makes sure variables are set even if the mutation is restored
      // in which case we call execute without input
      // we need to store variables here because dispatching success or error
      // will reset the variables to undefined and then onSuccess and other callbacks won't see them
      variables = this.state.variables
      const data = await executeMutation()

      // Notify cache callback
      await this.#mutationCache.config.onSuccess?.(
        data,
        variables,
        this.state.context,
        this as Mutation<unknown, unknown, unknown, unknown>,
      )

      await this.options.onSuccess?.(data, variables!, this.state.context!)

      await this.options.onSettled?.(data, null, variables!, this.state.context)

      this.#dispatch({ type: 'success', data, variables: variables! })
      return data
    } catch (error) {
      try {
        // Notify cache callback
        await this.#mutationCache.config.onError?.(
          error,
          variables,
          this.state.context,
          this as Mutation<unknown, unknown, unknown, unknown>,
        )

        if (process.env.NODE_ENV !== 'production') {
          this.#logger.error(error)
        }

        await this.options.onError?.(
          error as TError,
          variables!,
          this.state.context,
        )

        await this.options.onSettled?.(
          undefined,
          error as TError,
          variables!,
          this.state.context,
        )
        throw error
      } finally {
        this.#dispatch({
          type: 'error',
          error: error as TError,
          variables: variables!,
        })
      }
    }
  }

  #dispatch(action: Action<TData, TError, TVariables, TContext>): void {
    const reducer = (
      state: MutationState<TData, TError, TVariables, TContext>,
    ): MutationState<TData, TError, TVariables, TContext> => {
      switch (action.type) {
        case 'failed':
          return {
            ...state,
            failureCount: action.failureCount,
            failureReason: action.error,
          }
        case 'pause':
          return {
            ...state,
            isPaused: true,
          }
        case 'continue':
          return {
            ...state,
            isPaused: false,
          }
        case 'loading':
          return {
            ...state,
            context: action.context,
            data: undefined,
            failureCount: 0,
            failureReason: null,
            error: null,
            isPaused: !canFetch(this.options.networkMode),
            status: 'loading',
            variables: action.variables,
          }
        case 'success':
          return {
            ...state,
            data: action.data,
            failureCount: 0,
            failureReason: null,
            error: null,
            status: 'success',
            isPaused: false,
            variables: undefined,
          }
        case 'error':
          return {
            ...state,
            data: undefined,
            error: action.error,
            failureCount: state.failureCount + 1,
            failureReason: action.error,
            isPaused: false,
            status: 'error',
            variables: undefined,
          }
      }
    }
    this.state = reducer(this.state)

    notifyManager.batch(() => {
      this.#observers.forEach((observer) => {
        observer.onMutationUpdate(action)
      })
      this.#mutationCache.notify({
        mutation: this,
        type: 'updated',
        action,
      })
    })
  }
}

export function getDefaultState<
  TData,
  TError,
  TVariables,
  TContext,
>(): MutationState<TData, TError, TVariables, TContext> {
  return {
    context: undefined,
    data: undefined,
    error: null,
    failureCount: 0,
    failureReason: null,
    isPaused: false,
    status: 'idle',
    variables: undefined,
  }
}

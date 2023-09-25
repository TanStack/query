import { notifyManager } from './notifyManager'
import { Removable } from './removable'
import { canFetch, createRetryer } from './retryer'
import type {
  DefaultError,
  MutationMeta,
  MutationOptions,
  MutationStatus,
} from './types'
import type { MutationCache } from './mutationCache'
import type { MutationObserver } from './mutationObserver'
import type { Retryer } from './retryer'

// TYPES

interface MutationConfig<TData, TError, TVariables, TContext> {
  mutationId: number
  mutationCache: MutationCache
  options: MutationOptions<TData, TError, TVariables, TContext>
  defaultOptions?: MutationOptions<TData, TError, TVariables, TContext>
  state?: MutationState<TData, TError, TVariables, TContext>
}

export interface MutationState<
  TData = unknown,
  TError = DefaultError,
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
  submittedAt: number
}

interface FailedAction<TError> {
  type: 'failed'
  failureCount: number
  error: TError | null
}

interface PendingAction<TVariables, TContext> {
  type: 'pending'
  variables?: TVariables
  context?: TContext
}

interface SuccessAction<TData> {
  type: 'success'
  data: TData
}

interface ErrorAction<TError> {
  type: 'error'
  error: TError
}

interface PauseAction {
  type: 'pause'
}

interface ContinueAction {
  type: 'continue'
}

export type Action<TData, TError, TVariables, TContext> =
  | ContinueAction
  | ErrorAction<TError>
  | FailedAction<TError>
  | PendingAction<TVariables, TContext>
  | PauseAction
  | SuccessAction<TData>

// CLASS

export class Mutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> extends Removable {
  state: MutationState<TData, TError, TVariables, TContext>
  options!: MutationOptions<TData, TError, TVariables, TContext>
  readonly mutationId: number

  #observers: Array<MutationObserver<TData, TError, TVariables, TContext>>
  #defaultOptions?: MutationOptions<TData, TError, TVariables, TContext>
  #mutationCache: MutationCache
  #retryer?: Retryer<TData>

  constructor(config: MutationConfig<TData, TError, TVariables, TContext>) {
    super()

    this.mutationId = config.mutationId
    this.#defaultOptions = config.defaultOptions
    this.#mutationCache = config.mutationCache
    this.#observers = []
    this.state = config.state || getDefaultState()

    this.setOptions(config.options)
    this.scheduleGc()
  }

  setOptions(
    options?: MutationOptions<TData, TError, TVariables, TContext>,
  ): void {
    this.options = { ...this.#defaultOptions, ...options }

    this.updateGcTime(this.options.gcTime)
  }

  get meta(): MutationMeta | undefined {
    return this.options.meta
  }

  addObserver(observer: MutationObserver<any, any, any, any>): void {
    if (!this.#observers.includes(observer)) {
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
      if (this.state.status === 'pending') {
        this.scheduleGc()
      } else {
        this.#mutationCache.remove(this)
      }
    }
  }

  continue(): Promise<unknown> {
    return (
      this.#retryer?.continue() ??
      // continuing a mutation assumes that variables are set, mutation must have been dehydrated before
      this.execute(this.state.variables!)
    )
  }

  async execute(variables: TVariables): Promise<TData> {
    const executeMutation = () => {
      this.#retryer = createRetryer({
        fn: () => {
          if (!this.options.mutationFn) {
            return Promise.reject(new Error('No mutationFn found'))
          }
          return this.options.mutationFn(variables)
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

    const restored = this.state.status === 'pending'

    try {
      if (!restored) {
        this.#dispatch({ type: 'pending', variables })
        // Notify cache callback
        await this.#mutationCache.config.onMutate?.(
          variables,
          this as Mutation<unknown, unknown, unknown, unknown>,
        )
        const context = await this.options.onMutate?.(variables)
        if (context !== this.state.context) {
          this.#dispatch({
            type: 'pending',
            context,
            variables,
          })
        }
      }
      const data = await executeMutation()

      // Notify cache callback
      await this.#mutationCache.config.onSuccess?.(
        data,
        variables,
        this.state.context,
        this as Mutation<unknown, unknown, unknown, unknown>,
      )

      await this.options.onSuccess?.(data, variables, this.state.context)

      // Notify cache callback
      await this.#mutationCache.config.onSettled?.(
        data,
        null,
        this.state.variables,
        this.state.context,
        this as Mutation<unknown, unknown, unknown, unknown>,
      )

      await this.options.onSettled?.(data, null, variables, this.state.context)

      this.#dispatch({ type: 'success', data })
      return data
    } catch (error) {
      try {
        // Notify cache callback
        await this.#mutationCache.config.onError?.(
          error as any,
          variables,
          this.state.context,
          this as Mutation<unknown, unknown, unknown, unknown>,
        )

        await this.options.onError?.(
          error as TError,
          variables,
          this.state.context,
        )

        // Notify cache callback
        await this.#mutationCache.config.onSettled?.(
          undefined,
          error as any,
          this.state.variables,
          this.state.context,
          this as Mutation<unknown, unknown, unknown, unknown>,
        )

        await this.options.onSettled?.(
          undefined,
          error as TError,
          variables,
          this.state.context,
        )
        throw error
      } finally {
        this.#dispatch({ type: 'error', error: error as TError })
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
        case 'pending':
          return {
            ...state,
            context: action.context,
            data: undefined,
            failureCount: 0,
            failureReason: null,
            error: null,
            isPaused: !canFetch(this.options.networkMode),
            status: 'pending',
            variables: action.variables,
            submittedAt: Date.now(),
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
    submittedAt: 0,
  }
}

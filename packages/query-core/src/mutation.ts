import type {
  MutationOptions,
  MutationStatus,
  MutationMeta,
  RegisteredError,
} from './types'
import type { MutationCache } from './mutationCache'
import type { MutationObserver } from './mutationObserver'
import { notifyManager } from './notifyManager'
import { Removable } from './removable'
import type { Retryer } from './retryer'
import { canFetch, createRetryer } from './retryer'

// TYPES

interface MutationConfig<TData, TError, TVariables, TContext> {
  mutationId: number
  mutationCache: MutationCache
  options: MutationOptions<TData, TError, TVariables, TContext>
  defaultOptions?: MutationOptions<TData, TError, TVariables, TContext>
  state?: MutationState<TData, TError, TVariables, TContext>
  meta?: MutationMeta
}

export interface MutationState<
  TData = unknown,
  TError = RegisteredError,
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
  TError = RegisteredError,
  TVariables = void,
  TContext = unknown,
> extends Removable {
  state: MutationState<TData, TError, TVariables, TContext>
  options: MutationOptions<TData, TError, TVariables, TContext>
  mutationId: number

  #observers: MutationObserver<TData, TError, TVariables, TContext>[]
  #mutationCache: MutationCache
  #retryer?: Retryer<TData>

  constructor(config: MutationConfig<TData, TError, TVariables, TContext>) {
    super()

    this.options = {
      ...config.defaultOptions,
      ...config.options,
    }
    this.mutationId = config.mutationId
    this.#mutationCache = config.mutationCache
    this.#observers = []
    this.state = config.state || getDefaultState()

    this.updateGcTime(this.options.gcTime)
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
      if (this.state.status === 'pending') {
        this.scheduleGc()
      } else {
        this.#mutationCache.remove(this)
      }
    }
  }

  continue(): Promise<unknown> {
    return this.#retryer?.continue() ?? this.execute()
  }

  async execute(): Promise<TData> {
    const executeMutation = () => {
      this.#retryer = createRetryer({
        fn: () => {
          if (!this.options.mutationFn) {
            return Promise.reject(new Error('No mutationFn found'))
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

    const restored = this.state.status === 'pending'
    try {
      if (!restored) {
        this.#dispatch({ type: 'pending', variables: this.options.variables! })
        // Notify cache callback
        await this.#mutationCache.config.onMutate?.(
          this.state.variables,
          this as Mutation<unknown, unknown, unknown, unknown>,
        )
        const context = await this.options.onMutate?.(this.state.variables!)
        if (context !== this.state.context) {
          this.#dispatch({
            type: 'pending',
            context,
            variables: this.state.variables,
          })
        }
      }
      const data = await executeMutation()

      // Notify cache callback
      await this.#mutationCache.config.onSuccess?.(
        data,
        this.state.variables,
        this.state.context,
        this as Mutation<unknown, unknown, unknown, unknown>,
      )

      await this.options.onSuccess?.(
        data,
        this.state.variables!,
        this.state.context!,
      )

      await this.options.onSettled?.(
        data,
        null,
        this.state.variables!,
        this.state.context,
      )

      this.#dispatch({ type: 'success', data })
      return data
    } catch (error) {
      try {
        // Notify cache callback
        await this.#mutationCache.config.onError?.(
          error,
          this.state.variables,
          this.state.context,
          this as Mutation<unknown, unknown, unknown, unknown>,
        )

        await this.options.onError?.(
          error as TError,
          this.state.variables!,
          this.state.context,
        )

        await this.options.onSettled?.(
          undefined,
          error as TError,
          this.state.variables!,
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
  }
}

import {
  MutationObserver,
  type DefaultError,
  type MutateOptions,
  type MutationObserverOptions,
  type MutationObserverResult,
} from '@tanstack/query-core'
import type { QueryClient } from '@tanstack/query-core'
import type { ReactiveControllerHost } from 'lit'
import {
  createValueAccessor,
  readAccessor,
  type Accessor,
  type ValueAccessor,
} from './accessor.js'
import { createMissingQueryClientError } from './context.js'
import { BaseController } from './controllers/BaseController.js'

/**
 * Options accepted by `createMutationController`.
 *
 * This is the Lit adapter shape for `MutationObserverOptions`. Pass it directly
 * or through an `Accessor` when the options depend on Lit host state.
 */
export type CreateMutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>

/**
 * Accessor returned by `createMutationController`.
 *
 * Call the accessor or read its `current` property to get the latest mutation
 * result. The attached methods delegate to the active mutation observer.
 */
export type MutationResultAccessor<TData, TError, TVariables, TOnMutateResult> =
  ValueAccessor<
    MutationObserverResult<TData, TError, TVariables, TOnMutateResult>
  > & {
    /**
     * Starts the mutation and swallows the returned promise.
     *
     * Throws synchronously if no `QueryClient` can be resolved.
     */
    mutate: (
      variables: TVariables,
      options?: MutateOptions<TData, TError, TVariables, TOnMutateResult>,
    ) => void
    /**
     * Starts the mutation and returns the observer promise.
     *
     * Rejects if no `QueryClient` can be resolved.
     */
    mutateAsync: MutationObserverResult<
      TData,
      TError,
      TVariables,
      TOnMutateResult
    >['mutate']
    /** Resets the mutation observer to its idle state. */
    reset: MutationObserverResult<
      TData,
      TError,
      TVariables,
      TOnMutateResult
    >['reset']
    /** Removes the controller from its Lit host and unsubscribes observers. */
    destroy: () => void
  }

function createIdleMutationResult<
  TData,
  TError,
  TVariables,
  TOnMutateResult,
>(): MutationObserverResult<TData, TError, TVariables, TOnMutateResult> {
  return {
    context: undefined,
    data: undefined,
    error: null,
    failureCount: 0,
    failureReason: null,
    isError: false,
    isIdle: true,
    isPending: false,
    isPaused: false,
    isSuccess: false,
    status: 'idle',
    submittedAt: 0,
    variables: undefined,
    mutate: (() =>
      Promise.reject(
        createMissingQueryClientError(),
      )) as MutationObserverResult<
      TData,
      TError,
      TVariables,
      TOnMutateResult
    >['mutate'],
    reset: (() => undefined) as MutationObserverResult<
      TData,
      TError,
      TVariables,
      TOnMutateResult
    >['reset'],
  } as MutationObserverResult<TData, TError, TVariables, TOnMutateResult>
}

class MutationController<
  TData,
  TError,
  TVariables,
  TOnMutateResult,
> extends BaseController<
  MutationObserverResult<TData, TError, TVariables, TOnMutateResult>
> {
  private readonly options: Accessor<
    CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>
  >
  private observer:
    | MutationObserver<TData, TError, TVariables, TOnMutateResult>
    | undefined
  private unsubscribe: (() => void) | undefined
  private queryClient: QueryClient | undefined

  constructor(
    host: ReactiveControllerHost,
    options: Accessor<
      CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>
    >,
    queryClient?: QueryClient,
  ) {
    super(host, createIdleMutationResult(), queryClient)
    this.options = options

    if (!queryClient) {
      return
    }

    if (typeof options === 'function') {
      return
    }

    const observer = new MutationObserver(
      queryClient,
      this.defaultOptions(queryClient),
    )
    this.queryClient = queryClient
    this.observer = observer
    this.result = observer.getCurrentResult()
  }

  protected onConnected(): void {
    if (!this.syncClient()) {
      return
    }

    this.refreshOptions()
    this.subscribe()
    if (this.observer) {
      this.setResult(this.observer.getCurrentResult())
    }
  }

  protected onDisconnected(): void {
    this.unsubscribeObserver()
    this.syncClient()
  }

  protected onHostUpdate(): void {
    if (typeof this.options !== 'function') {
      return
    }

    this.refreshOptions()
  }

  protected onQueryClientChanged(): void {
    if (!this.syncClient() || !this.connectedState) {
      return
    }

    this.refreshOptions()
    this.subscribe()
    if (this.observer) {
      this.setResult(this.observer.getCurrentResult())
    }
  }

  mutate = (
    variables: TVariables,
    mutateOptions?: MutateOptions<TData, TError, TVariables, TOnMutateResult>,
  ): void => {
    if (!this.syncClient() || !this.observer) {
      throw createMissingQueryClientError()
    }

    void this.observer.mutate(variables, mutateOptions).catch(() => {
      // Intentionally swallow in sync mutate path.
    })
  }

  mutateAsync: MutationObserverResult<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  >['mutate'] = (...args) => {
    if (!this.syncClient() || !this.observer) {
      return Promise.reject(createMissingQueryClientError())
    }

    return this.observer.mutate(...args)
  }

  reset: MutationObserverResult<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  >['reset'] = () => {
    if (!this.syncClient() || !this.observer) {
      return
    }

    this.observer.reset()
    this.setResult(this.observer.getCurrentResult())
  }

  private subscribe(): void {
    if (!this.observer) {
      return
    }

    if (this.unsubscribe) {
      return
    }

    this.unsubscribe = this.observer.subscribe((next) => {
      this.setResult(next)
    })
  }

  private unsubscribeObserver(): void {
    this.unsubscribe?.()
    this.unsubscribe = undefined
  }

  private syncClient(): boolean {
    const nextClient = this.tryGetQueryClient()
    if (!nextClient) {
      this.unsubscribeObserver()
      this.queryClient = undefined
      this.observer = undefined
      this.setResult(createIdleMutationResult())
      return false
    }

    if (nextClient === this.queryClient) {
      return true
    }

    this.unsubscribeObserver()
    this.queryClient = nextClient
    this.observer = new MutationObserver(
      this.queryClient,
      this.defaultOptions(this.queryClient),
    )
    this.setResult(this.observer.getCurrentResult())
    return true
  }

  private refreshOptions(): boolean {
    if (!this.syncClient() || !this.observer || !this.queryClient) {
      return false
    }

    this.observer.setOptions(this.defaultOptions())
    this.setResult(this.observer.getCurrentResult())
    return true
  }

  private defaultOptions(
    client = this.queryClient,
  ): MutationObserverOptions<TData, TError, TVariables, TOnMutateResult> {
    if (!client) {
      throw createMissingQueryClientError()
    }

    return client.defaultMutationOptions(readAccessor(this.options))
  }
}

/**
 * Creates a Lit reactive controller that subscribes the host to a mutation.
 *
 * The returned accessor is callable and also exposes `current`, `mutate`,
 * `mutateAsync`, `reset`, and `destroy`. When `options` is a function, it is
 * re-read during host updates so mutation options can follow reactive host
 * state.
 *
 * If `queryClient` is omitted, the controller resolves the client from the
 * nearest connected `QueryClientProvider`.
 *
 * @param host - The Lit reactive controller host that owns the mutation
 * subscription.
 * @param options - Mutation observer options, or a getter that returns options.
 * @param queryClient - Optional explicit query client. Provide this for
 * controllers that should not resolve a client from Lit context.
 * @returns An accessor for the latest mutation result with mutation helper
 * methods.
 *
 * @example
 * ```ts
 * import { LitElement, html } from 'lit'
 * import { createMutationController } from '@tanstack/lit-query'
 *
 * class AddTodoForm extends LitElement {
 *   private readonly addTodo = createMutationController(this, {
 *     mutationFn: (title: string) =>
 *       fetch('/api/todos', { method: 'POST', body: JSON.stringify({ title }) }),
 *   })
 *
 *   render() {
 *     const mutation = this.addTodo()
 *
 *     return html`
 *       <button ?disabled=${mutation.isPending} @click=${() => this.addTodo.mutate('Ship docs')}>
 *         Add todo
 *       </button>
 *     `
 *   }
 * }
 * ```
 */
export function createMutationController<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  host: ReactiveControllerHost,
  options: Accessor<
    CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>
  >,
  queryClient?: QueryClient,
): MutationResultAccessor<TData, TError, TVariables, TOnMutateResult> {
  const controller = new MutationController(host, options, queryClient)

  return Object.assign(
    createValueAccessor(() => controller.current),
    {
      mutate: controller.mutate,
      mutateAsync: controller.mutateAsync,
      reset: controller.reset,
      destroy: () => controller.destroy(),
    },
  )
}

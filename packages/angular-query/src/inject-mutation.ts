import {
  assertInInjectionContext,
  computed,
  effect,
  inject,
  untracked,
} from '@angular/core'
import { MutationObserver, QueryClient, noop } from '@tanstack/query-core'
import { injectQueryZone } from './utils/inject-query-zone'
import { signalProxy } from './utils/signal-proxy'
import { mutationResultFields } from './utils/result-fields'
import { injectPendingTasksLifecycle } from './utils/inject-pending-tasks-lifecycle'
import { injectExternalStore } from './utils/inject-external-store'
import type { DefaultError } from '@tanstack/query-core'
import type {
  CreateMutateAsyncFunction,
  CreateMutateFunction,
  CreateMutationOptions,
  CreateMutationResult,
} from './types'

/**
 * Injects a mutation: an imperative function that can be invoked which typically performs server side effects.
 * Unlike queries, mutations are not run automatically.
 *
 * @see https://tanstack.com/query/latest/docs/framework/angular/guides/mutations
 * @see {@link mutationOptions} to share these options between `injectMutation` and `injectMutationState`.
 * @param optionsFn - A function that returns mutation options. Similar to `computed` from Angular, this
 * function runs in the reactive context, so signals read inside it drive the mutation.
 * @returns The mutation result, including `mutate` and `mutateAsync`.
 *
 * @example
 * ```angular-ts
 * @Component({
 *   template: `
 *     @if (mutation.isPending()) {
 *       Saving...
 *     } @else if (mutation.isError()) {
 *       <span>Error: {{ mutation.error()?.message }}</span>
 *     }
 *     <button (click)="mutation.mutate({ title: 'New post' })">Create</button>
 *   `,
 * })
 * export class CreatePost {
 *   readonly mutation = injectMutation(() => ({
 *     mutationFn: createPost,
 *   }))
 * }
 * ```
 */
export function injectMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  optionsFn: () => CreateMutationOptions<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  >,
): CreateMutationResult<TData, TError, TVariables, TOnMutateResult> {
  if (typeof ngDevMode === 'undefined' || ngDevMode) {
    assertInInjectionContext(injectMutation)
  }
  const outsideZone = injectQueryZone()
  const queryClient = inject(QueryClient)
  const lifecycle = injectPendingTasksLifecycle()

  const optionsSignal = computed(optionsFn)

  const observerSignal = computed(
    () => new MutationObserver(queryClient, untracked(optionsSignal)),
  )

  // Configure the observer outside the result computation. Mutation-cache
  // listeners can synchronously read the public result while setOptions emits.
  effect(() => {
    const options = optionsSignal()
    outsideZone(() => untracked(() => observerSignal().setOptions(options)))
  })

  const mutationStateSignal = injectExternalStore(() => {
    const observer = observerSignal()
    return {
      getSnapshot: () => observer.getCurrentResult(),
      subscribe: (onStoreChange) => observer.subscribe(onStoreChange),
    }
  })

  const mutate: CreateMutateFunction<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  > = (...args) => {
    mutateAsync(...args).catch(noop)
  }

  let pendingInvocations = 0

  const mutateAsync: CreateMutateAsyncFunction<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  > = (...args) => {
    return outsideZone(() =>
      untracked(() => {
        const observer = observerSignal()
        observer.setOptions(optionsSignal())
        pendingInvocations++
        lifecycle.setPending(true)
        // Track invocations, not the observer's latest result: reset or a later
        // mutation completing must not release work which is still running.
        const settled = () => {
          pendingInvocations--
          lifecycle.setPending(pendingInvocations > 0)
        }
        try {
          return observer
            .mutate(args[0] as TVariables, args[1])
            .finally(settled)
        } catch (error) {
          settled()
          throw error
        }
      }),
    )
  }

  const reset = () => {
    outsideZone(() =>
      untracked(() => {
        const observer = observerSignal()
        observer.setOptions(optionsSignal())
        observer.reset()
      }),
    )
  }

  return Object.assign(signalProxy(mutationStateSignal, mutationResultFields), {
    mutate,
    mutateAsync,
    reset,
  }) as unknown as CreateMutationResult<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  >
}

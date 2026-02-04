/* istanbul ignore file */

export type NonUndefinedGuard<T> = T extends undefined ? never : T

export type DistributiveOmit<
  TObject,
  TKey extends keyof TObject,
> = TObject extends any ? Omit<TObject, TKey> : never

export type OmitKeyof<
  TObject,
  TKey extends TStrictly extends 'safely'
    ?
        | keyof TObject
        | (string & Record<never, never>)
        | (number & Record<never, never>)
        | (symbol & Record<never, never>)
    : keyof TObject,
  TStrictly extends 'strictly' | 'safely' = 'strictly',
> = Omit<TObject, TKey>

export type Override<TTargetA, TTargetB> = {
  [AKey in keyof TTargetA]: AKey extends keyof TTargetB
    ? TTargetB[AKey]
    : TTargetA[AKey]
}

export type NoInfer<T> = [T][T extends any ? 0 : never]

/**
 * Register interface for module augmentation.
 * Extend this interface to customize global types like defaultError and queryMeta.
 *
 * @example
 * ```ts
 * declare module '@tanstack/query-core' {
 *   interface Register {
 *     defaultError: AxiosError
 *     queryMeta: { auth?: boolean }
 *   }
 * }
 * ```
 */
export interface Register {
  // defaultError: Error
  // queryMeta: Record<string, unknown>
  // mutationMeta: Record<string, unknown>
  // queryKey: ReadonlyArray<unknown>
  // mutationKey: ReadonlyArray<unknown>
}

/**
 * The default error type used when no error type is specified.
 * Can be customized via module augmentation of the Register interface.
 */
export type DefaultError = Register extends {
  defaultError: infer TError
}
  ? TError
  : Error

export type WithRequired<TTarget, TKey extends keyof TTarget> = TTarget & {
  [_ in TKey]: {}
}

/**
 * Controls when queries and mutations should execute based on network connectivity.
 * - 'online': Only fetches when online (default)
 * - 'always': Always fetches regardless of network status
 * - 'offlineFirst': Fetches from cache first, then network when online
 */
export type NetworkMode = 'online' | 'always' | 'offlineFirst'

export interface CancelOptions {
  revert?: boolean
  silent?: boolean
}

export interface SetDataOptions {
  updatedAt?: number
}

export type NotifyEventType =
  | 'added'
  | 'removed'
  | 'updated'
  | 'observerAdded'
  | 'observerRemoved'
  | 'observerResultsUpdated'
  | 'observerOptionsUpdated'

export interface NotifyEvent {
  type: NotifyEventType
}

export interface ResultOptions {
  throwOnError?: boolean
}

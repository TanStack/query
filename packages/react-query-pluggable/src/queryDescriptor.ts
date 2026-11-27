/** The observer chosen by a React option factory. Enumerable so descriptor spreads preserve it. */
export const observerKey = Symbol('queryObserver')

/** A prepared descriptor selects its observer without exposing a user-configurable option. */
export interface QueryDescriptor<TObserver> {
  /** The constructor to use for this observer. */
  readonly [observerKey]: TObserver
}

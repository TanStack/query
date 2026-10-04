type TrackableQueryObserver<TResult extends object> = {
  options: { notifyOnChangeProps?: unknown }
  trackResult: (result: TResult) => unknown
}

/**
 * Wraps observer results with property tracking when `notifyOnChangeProps` is
 * not set, so the observer only notifies about the properties the host reads.
 */
export class QueryObserverResultTracker<TResult extends object> {
  private result: TResult | undefined
  private usesTracking = false

  /**
   * Forgets the last result, so the next `update` returns a result again.
   */
  reset(): void {
    this.result = undefined
    this.usesTracking = false
  }

  /**
   * Returns the result to expose, tracked through the observer when it uses
   * property tracking.
   * @param observer - The observer the result comes from, if any.
   * @param result - The latest result of the observer.
   * @returns The result to expose, or `undefined` if neither the result nor
   * the tracking mode changed since the last call.
   */
  update(
    observer: TrackableQueryObserver<TResult> | undefined,
    result: TResult,
  ): TResult | undefined {
    const usesTracking = !!observer && !observer.options.notifyOnChangeProps

    if (Object.is(this.result, result) && this.usesTracking === usesTracking) {
      return undefined
    }

    this.result = result
    this.usesTracking = usesTracking

    return usesTracking ? (observer.trackResult(result) as TResult) : result
  }
}

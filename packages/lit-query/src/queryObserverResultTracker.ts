type TrackableQueryObserver<TResult extends object> = {
  options: { notifyOnChangeProps?: unknown }
  trackResult: (result: TResult) => unknown
}

export class QueryObserverResultTracker<TResult extends object> {
  private result: TResult | undefined
  private usesTracking = false

  reset(): void {
    this.result = undefined
    this.usesTracking = false
  }

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

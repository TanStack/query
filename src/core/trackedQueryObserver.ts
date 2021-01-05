import { QueryObserver } from './queryObserver'
import { InfiniteQueryObserverResult } from './types'
import type { QueryObserverResult } from './types'

export class TrackedQueryObserver<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData
> extends QueryObserver<TQueryFnData, TError, TData, TQueryData> {
  createQueryResult(
    result: QueryObserverResult<TData, TError>
  ): QueryObserverResult<TData, TError> {
    const addNotifyOnChangeProps = (
      prop: keyof InfiniteQueryObserverResult
    ) => {
      if (!this.options.notifyOnChangeProps) {
        this.options.notifyOnChangeProps = []
      }

      if (!this.options.notifyOnChangeProps.includes(prop)) {
        this.options.notifyOnChangeProps.push(prop)
      }
    }

    return new Proxy(result, {
      get(target, prop, receiver) {
        addNotifyOnChangeProps(prop as keyof InfiniteQueryObserverResult)
        return Reflect.get(target, prop, receiver)
      },
    })
  }
}

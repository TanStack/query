import { notifyManager } from '@tanstack/query-core'
import { cloneDeep } from 'lodash-es'
import { unstate, untrack } from 'svelte'
import { useIsRestoring } from './useIsRestoring'
import { useQueryClient } from './useQueryClient'
import type { CreateBaseQueryOptions, CreateBaseQueryResult } from './types'
import type {
  QueryClient,
  QueryKey,
  QueryObserver,
  QueryObserverResult,
} from '@tanstack/query-core'

function clone(v: any) {
  return cloneDeep(v)
}
export function createBaseQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
>(
  options: CreateBaseQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >,
  Observer: typeof QueryObserver,
  queryClient?: QueryClient,
): CreateBaseQueryResult<TData, TError> {
  /** Load query client */
  const client = useQueryClient(queryClient)
  const isRestoring = useIsRestoring()
  const optionsStore = typeof options !== 'function' ? () => options : options

  /** Creates a store that has the default options applied */
  function updateOptions() {
    const queryKey = optionsStore().queryKey?.map((v) => unstate(v))

    const defaultedOptions = client.defaultQueryOptions({
      ...optionsStore(),
      //@ts-ignore
      queryKey: queryKey, // prevent reactive query  in devTools
    })

    defaultedOptions._optimisticResults == isRestoring
      ? 'isRestoring'
      : 'optimistic'

    defaultedOptions.structuralSharing = false
    // console.log('default option update', defaultedOptions)

    return defaultedOptions
  }

  const defaultedOptionsStore = $derived(updateOptions)
  /** Creates the observer */
  const observer = $derived(
    new Observer<TQueryFnData, TError, TData, TQueryData, TQueryKey>(
      client,
      defaultedOptionsStore(),
    ),
  )

  let result = $state<QueryObserverResult<TData, TError>>(
    observer.getOptimisticResult(defaultedOptionsStore()),
  )

  function upResult(r: QueryObserverResult<TData, TError>) {
    Object.assign(result, r)
  }
  $effect(() => {
    let un = () => undefined
    //console.log('batch:calling $effect subscribe observer')
    if (!isRestoring) {
      {
        //@ts-expect-error
        un = observer.subscribe((v) => {
          // console.log('subscribed result', v.data)
          notifyManager.batchCalls(() => {
            const temp = observer.getOptimisticResult(defaultedOptionsStore())
            upResult(temp)
          })()
        })
      }
    }

    observer.updateResult()
    return () => {
      //console.log('batch unsubscribe')
      un()
    }
  })

  /** Subscribe to changes in result and defaultedOptionsStore */
  $effect.pre(() => {
    observer.setOptions(defaultedOptionsStore(), { listeners: false })

    upResult(observer.getOptimisticResult(defaultedOptionsStore()))
    //   result = observer.getOptimisticResult(defaultedOptionsStore()) //prevent lag , somehow observer.subscribe does not return
    // console.log('option updated', defaultedOptionsStore())
  })

  const final_ = $state({ value: result })

  //update result
  $effect(() => {
    // svelte does not need this with it is proxy state and fine-grained reactivity?
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (result !== null)
      untrack(() => {
        const v = !defaultedOptionsStore().notifyOnChangeProps
          ? observer.trackResult(result)
          : result

        final_.value = Object.assign(final_.value, v)
        //console.log('result effect', final_.value.data)
      })
  })
  //@ts-ignore
  return new Proxy(final_, {
    set() {
      console.log('Please do not update query state!')
      return false
    },
    get(target, p) {
      if (p == 'value') {
        return target.value
      }
      if (p == 'JSON') {
        return target.value
      }
      //@ts-expect-error
      return target.value[p]
    },
  })
}

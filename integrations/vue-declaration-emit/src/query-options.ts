import { queryOptions } from '@tanstack/vue-query'

/** @public */
export const undefinedInitialDataOptions = queryOptions({
  queryKey: ['undefined-initial-data'],
  queryFn: async () => ({ value: 'data' }),
})

/** @public */
export const definedInitialDataOptions = queryOptions({
  queryKey: ['defined-initial-data'],
  queryFn: async () => ({ value: 'data' }),
  initialData: { value: 'initial data' },
})

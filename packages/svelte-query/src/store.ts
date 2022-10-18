import {
  QueryClient,
  QueryCache,
  MutationCache,
  type DefaultOptions,
} from '@tanstack/query-core'
import { readable } from 'svelte/store'

// Props with default values
const queryCache = new QueryCache()
const mutationCache = new MutationCache()
const defaultOptions: DefaultOptions = {}
const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions,
})

export const client = readable<QueryClient>(queryClient)

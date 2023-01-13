import type { DehydratedState } from '@tanstack/query-core'
import { writable } from 'svelte/store'

export const dehydratedState = writable<DehydratedState>()

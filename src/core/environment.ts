import { partialMatchKey } from './utils'
import type {
  DefaultOptions,
  MutationKey,
  MutationOptions,
  QueryKey,
  QueryObserverOptions,
  QueryOptions,
} from './types'
import type { QueryCache } from './queryCache'
import type { MutationCache } from './mutationCache'
import { focusManager } from './focusManager'
import { onlineManager } from './onlineManager'

// TYPES

interface EnvironmentConfig {
  queryCache: QueryCache
  mutationCache?: MutationCache
  defaultOptions?: DefaultOptions
}

interface QueryDefaults {
  queryKey: QueryKey
  defaultOptions: QueryOptions<any, any, any>
}

interface MutationDefaults {
  mutationKey: MutationKey
  defaultOptions: MutationOptions<any, any, any, any>
}

// CLASS

export class Environment {
  private queryCache: QueryCache
  private mutationCache?: MutationCache
  private defaultOptions: DefaultOptions
  private queryDefaults: QueryDefaults[]
  private mutationDefaults: MutationDefaults[]
  private unsubscribeFocus?: () => void
  private unsubscribeOnline?: () => void

  constructor(config: EnvironmentConfig) {
    this.queryCache = config.queryCache
    this.mutationCache = config.mutationCache
    this.defaultOptions = config.defaultOptions || {}
    this.queryDefaults = []
    this.mutationDefaults = []
  }

  mount(): void {
    this.unsubscribeFocus = focusManager.subscribe(() => {
      if (focusManager.isFocused() && onlineManager.isOnline()) {
        this.mutationCache?.onFocus()
        this.queryCache.onFocus()
      }
    })
    this.unsubscribeOnline = onlineManager.subscribe(() => {
      if (focusManager.isFocused() && onlineManager.isOnline()) {
        this.mutationCache?.onOnline()
        this.queryCache.onOnline()
      }
    })
  }

  unmount(): void {
    this.unsubscribeFocus?.()
    this.unsubscribeOnline?.()
  }

  getQueryCache(): QueryCache {
    return this.queryCache
  }

  getMutationCache(): MutationCache {
    if (!this.mutationCache) {
      throw new Error('Missing MutationCache')
    }
    return this.mutationCache
  }

  getDefaultOptions(): DefaultOptions {
    return this.defaultOptions
  }

  setDefaultOptions(options: DefaultOptions): void {
    this.defaultOptions = options
  }

  setQueryDefaults(
    queryKey: QueryKey,
    options: QueryOptions<any, any, any>
  ): void {
    const result = this.queryDefaults.find(x =>
      partialMatchKey(x.queryKey, queryKey)
    )
    if (result) {
      result.defaultOptions = options
    } else {
      this.queryDefaults.push({ queryKey, defaultOptions: options })
    }
  }

  getQueryDefaults(
    queryKey: QueryKey
  ): QueryOptions<any, any, any> | undefined {
    return this.queryDefaults.find(x => partialMatchKey(x.queryKey, queryKey))
      ?.defaultOptions
  }

  setMutationDefaults(
    mutationKey: MutationKey,
    options: MutationOptions<any, any, any, any>
  ): void {
    const result = this.mutationDefaults.find(x =>
      partialMatchKey(x.mutationKey, mutationKey)
    )
    if (result) {
      result.defaultOptions = options
    } else {
      this.mutationDefaults.push({ mutationKey, defaultOptions: options })
    }
  }

  getMutationDefaults(
    mutationKey: MutationKey
  ): MutationOptions<any, any, any, any> | undefined {
    return this.mutationDefaults.find(x =>
      partialMatchKey(x.mutationKey, mutationKey)
    )?.defaultOptions
  }

  defaultQueryOptions<T extends QueryOptions<any, any>>(options?: T): T {
    return { ...this.defaultOptions.queries, ...options } as T
  }

  defaultQueryObserverOptions<T extends QueryObserverOptions<any, any>>(
    options?: T
  ): T {
    return { ...this.defaultOptions.queries, ...options } as T
  }

  defaultMutationOptions<T extends MutationOptions<any, any, any, any>>(
    options?: T
  ): T {
    return { ...this.defaultOptions.mutations, ...options } as T
  }

  clear(): void {
    this.queryCache.clear()
    this.mutationCache?.clear()
  }
}

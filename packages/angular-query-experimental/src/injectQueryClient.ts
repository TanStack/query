import {
  Injector,
  assertInInjectionContext,
  inject,
  runInInjectionContext,
} from '@angular/core'
import { createNoopInjectionToken } from 'ngxtension/create-injection-token'
import type { InjectOptions } from '@angular/core'
import type { QueryClient } from '@tanstack/query-core'

const [, provideQueryClient, QUERY_CLIENT] =
  createNoopInjectionToken<QueryClient>('QueryClient')

const injectQueryClient = ({
  injector,
  ...injectOptions
}: InjectOptions & { injector?: Injector } = {}) => {
  !injector && assertInInjectionContext(injectQueryClient)
  const assertedInjector = injector ?? inject(Injector)
  return runInInjectionContext(assertedInjector, () =>
    inject(QUERY_CLIENT, injectOptions as InjectOptions),
  )
}

export { injectQueryClient, provideQueryClient, QUERY_CLIENT }

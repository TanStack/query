import { Injectable, inject } from '@angular/core'
import { QUERY_CLIENT } from './injectQueryClient'
import type { QueryClient } from '@tanstack/query-core'
import type { OnDestroy } from '@angular/core'

/**
 * @internal
 */
@Injectable()
export class QueryClientMounter implements OnDestroy {
  #queryClient: QueryClient = inject(QUERY_CLIENT)

  constructor() {
    this.#queryClient.mount()
  }

  ngOnDestroy() {
    this.#queryClient.unmount()
  }
}

import type { ResourceStatus } from '@angular/core'

// Angular 20 does not expose ResourceSnapshot. Remove this local type when the
// minimum supported Angular version provides it.
export type ResourceSnapshot<T> =
  | { readonly status: 'error'; readonly error: Error }
  | {
      readonly status: Exclude<ResourceStatus, 'error'>
      readonly value: T
    }

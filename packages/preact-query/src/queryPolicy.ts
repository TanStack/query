import type { QueryRenderPolicy } from './queryDescriptor'

/** Ordinary queries expose their observer state directly. */
export const queryPolicy = {
  suspense: false,
} as const satisfies QueryRenderPolicy<false>

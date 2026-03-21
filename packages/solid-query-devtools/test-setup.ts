import '@testing-library/jest-dom/vitest'
import { cleanup } from '@solidjs/testing-library'
import { afterEach, vi } from 'vitest'

/**
 * @tanstack/query-devtools is written for Solid 1, where Suspense around
 * lazy() was optional. During tests, @tanstack/custom-condition causes
 * query-devtools source to be recompiled against Solid 2's runtime, which
 * requires lazy() components to be inside a Loading boundary.
 *
 * This mock wraps lazy() so the returned component automatically renders
 * inside a Loading boundary, bridging the Solid 1 → 2 behavioral gap.
 */
vi.mock('solid-js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('solid-js')>()
  return {
    ...mod,
    Suspense: mod.Loading,
    lazy: (fn: () => Promise<{ default: any }>) => {
      const Comp = mod.lazy(fn)
      return (props: any) =>
        mod.createComponent(mod.Loading, {
          get children() {
            return mod.createComponent(Comp, props)
          },
        })
    },
  }
})

// https://github.com/solidjs/solid-testing-library
afterEach(() => cleanup())

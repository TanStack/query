import { vi } from 'vitest'

vi.mock('vue-demi', async () => {
  const vue = await vi.importActual('vue-demi')
  return {
    ...(vue as any),
    inject: vi.fn(),
    provide: vi.fn(),
    onScopeDispose: vi.fn(),
    getCurrentInstance: vi.fn(() => ({ proxy: {} })),
    hasInjectionContext: vi.fn(() => true),
  }
})

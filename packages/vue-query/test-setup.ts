import { vi } from 'vitest'

vi.mock(import('vue'), async (importOriginal) => {
  const vue = await importOriginal()
  return {
    ...vue,
    inject: vi.fn(),
    onScopeDispose: vi.fn(),
    hasInjectionContext: vi.fn(() => true),
  }
})

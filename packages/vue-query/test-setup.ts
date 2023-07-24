import { vi } from 'vitest'

import Vue from 'vue2'
Vue.config.productionTip = false
Vue.config.devtools = false

// Hide annoying console warnings for Vue2
import Vue27 from 'vue2.7'
Vue27.config.productionTip = false
Vue27.config.devtools = false

vi.mock('vue-demi', async () => {
  const vue = await vi.importActual('vue-demi')
  return {
    ...(vue as any),
    inject: vi.fn(),
    provide: vi.fn(),
    onScopeDispose: vi.fn(),
    getCurrentInstance: vi.fn(() => ({ proxy: {} })),
  }
})

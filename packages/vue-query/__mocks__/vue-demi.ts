// Hide annoying console warnings for Vue2
import Vue from 'vue2'
Vue.config.productionTip = false
Vue.config.devtools = false

// Hide annoying console warnings for Vue2
import Vue27 from 'vue2.7'
Vue27.config.productionTip = false
Vue27.config.devtools = false

const vue = jest.requireActual('vue-demi')

module.exports = {
  ...vue,
  inject: jest.fn(),
  provide: jest.fn(),
  onScopeDispose: jest.fn(),
  getCurrentInstance: jest.fn(() => ({ proxy: {} })),
}

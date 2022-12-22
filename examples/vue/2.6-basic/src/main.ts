import Vue from 'vue'
import VueCompositionApi, { createApp, h } from '@vue/composition-api'
import { VueQueryPlugin } from '@tanstack/vue-query'

import App from './App.vue'

Vue.use(VueCompositionApi)
Vue.use(VueQueryPlugin)

createApp({
  render() {
    return h(App)
  },
}).mount('#app')

import { VueQueryPlugin } from '@tanstack/vue-query'
import VueCompositionApi, { createApp, h } from '@vue/composition-api'
import Vue from 'vue'
import App from './App.vue'

Vue.use(VueCompositionApi)
Vue.use(VueQueryPlugin)

createApp({
  render() {
    return h(App)
  },
}).mount('#app')

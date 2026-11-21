import { VueQueryPlugin } from '@tanstack/vue-query'
import Vue, { h } from 'vue'
import App from './App.vue'

Vue.use(VueQueryPlugin)

new Vue({
  el: '#app',

  render: () => {
    return h(App)
  },
})

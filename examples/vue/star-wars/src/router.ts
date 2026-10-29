import { createRouter, createWebHistory } from 'vue-router'
import Home from './Home.vue'
import Films from './Films.vue'
import Film from './Film.vue'
import Characters from './Characters.vue'
import Character from './Character.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/films', component: Films },
    { path: '/films/:filmId', component: Film, props: true },
    { path: '/characters', component: Characters },
    { path: '/characters/:characterId', component: Character, props: true },
  ],
})

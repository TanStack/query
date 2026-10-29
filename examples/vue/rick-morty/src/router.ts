import { createRouter, createWebHistory } from 'vue-router'
import Home from './Home.vue'
import Episodes from './Episodes.vue'
import Episode from './Episode.vue'
import Characters from './Characters.vue'
import Character from './Character.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/episodes', component: Episodes },
    { path: '/episodes/:episodeId', component: Episode, props: true },
    { path: '/characters', component: Characters },
    { path: '/characters/:characterId', component: Character, props: true },
  ],
})

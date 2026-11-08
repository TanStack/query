import { createRouter, createWebHistory } from 'vue-router'
import CharacterDetail from './CharacterDetail.vue'
import CharacterList from './CharacterList.vue'
import FilmDetail from './FilmDetail.vue'
import FilmList from './FilmList.vue'
import HomeView from './HomeView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/films', component: FilmList },
    { path: '/films/:filmId', component: FilmDetail, props: true },
    { path: '/characters', component: CharacterList },
    {
      path: '/characters/:characterId',
      component: CharacterDetail,
      props: true,
    },
  ],
})

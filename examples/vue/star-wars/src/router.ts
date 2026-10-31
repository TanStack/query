import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './HomeView.vue'
import FilmList from './FilmList.vue'
import FilmDetail from './FilmDetail.vue'
import CharacterList from './CharacterList.vue'
import CharacterDetail from './CharacterDetail.vue'

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

import { createRouter, createWebHistory } from 'vue-router'
import CharacterDetail from './CharacterDetail.vue'
import CharacterList from './CharacterList.vue'
import EpisodeDetail from './EpisodeDetail.vue'
import EpisodeList from './EpisodeList.vue'
import HomeView from './HomeView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/episodes', component: EpisodeList },
    { path: '/episodes/:episodeId', component: EpisodeDetail, props: true },
    { path: '/characters', component: CharacterList },
    {
      path: '/characters/:characterId',
      component: CharacterDetail,
      props: true,
    },
  ],
})

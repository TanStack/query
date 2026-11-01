import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './HomeView.vue'
import EpisodeList from './EpisodeList.vue'
import EpisodeDetail from './EpisodeDetail.vue'
import CharacterList from './CharacterList.vue'
import CharacterDetail from './CharacterDetail.vue'

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

import Home from './Home'
import Character from './Character'
import Episode from './Episode'

export default [
  {
    path: '/',
    exact: true,
    component: Home,
  },
  {
    path: '/characters/:characterId',
    component: Character,
  },
  {
    path: '/episodes/:episodeId',
    component: Episode,
  },
]

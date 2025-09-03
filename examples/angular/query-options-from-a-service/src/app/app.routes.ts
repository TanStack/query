import type { Route } from '@angular/router'

// loadComponent lazily loads the component
// when the component is the default export, there is no need to handle the promise

export const routes: Array<Route> = [
  {
    path: '',
    loadComponent: () => import('./components/posts.component'),
  },
  {
    path: 'post/:postId',
    loadComponent: () => import('./components/post.component'),
  },
]

import { index, layout, route } from '@react-router/dev/routes'
import type { RouteConfig } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('posts/:postId', 'routes/post.tsx'),
  route('posts/:postId/comments', 'routes/post-comments.tsx'),
  route('users/:userId', 'routes/user.tsx'),
  route('users/:userId/posts', 'routes/user-posts.tsx'),
  route('users/:userId/profile', 'routes/profile.tsx'),
  route('authors/:userId', 'routes/author.tsx'),
  route('dashboard/:userId', 'routes/dashboard.tsx'),
  route('search', 'routes/search.tsx'),
  route('tags', 'routes/tag-search.tsx'),
  route('authors/:userId/bio', 'routes/author-bio.tsx'),
  layout('routes/account-layout.tsx', [route('account', 'routes/account.tsx')]),
] satisfies RouteConfig

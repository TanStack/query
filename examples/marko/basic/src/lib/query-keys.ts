export const todosQueryKey = ['todos'] as const
export const todoPageQueryKey = (page: number) =>
  [...todosQueryKey, 'page', page] as const
export const todoFeedQueryKey = [...todosQueryKey, 'feed'] as const
export const todoSlowQueryKey = [...todosQueryKey, 'slow'] as const
export const todoCountQueryKey = (filter: string) =>
  [...todosQueryKey, 'count', filter] as const
export const brokenQueryKey = ['broken'] as const
export const todoSubscribedQueryKey = [...todosQueryKey, 'subscribed'] as const
export const todoUncachedQueryKey = [
  ...todosQueryKey,
  'subscribed-uncached',
] as const

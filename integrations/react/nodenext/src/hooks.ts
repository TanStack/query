import { useQuery, queryOptions } from '@tanstack/react-query'

export function useMyHook() {
  const query = useQuery(
    queryOptions({
      queryKey: ['test'],
      queryFn: () => 'hello',
    }),
  )

  return { data: query.data }
}

import { useQuery } from '@tanstack/react-query'

export function useMyHook() {
  const query = useQuery({
    queryKey: ['test'],
    queryFn: () => 'hello',
  })

  return { data: query.data }
}

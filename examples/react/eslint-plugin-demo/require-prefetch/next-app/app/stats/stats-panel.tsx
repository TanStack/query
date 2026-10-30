'use client'

import { useQuery } from '@tanstack/react-query'
import { getStats } from './get-stats'

export function StatsPanel() {
  // eslint-disable-next-line @tanstack/query/prefer-query-options -- inline options on purpose, see ./page.tsx
  const { data } = useQuery({ queryKey: ['stats'], queryFn: getStats })

  return (
    <p>
      {data?.visitors ?? 0} visitors, {data?.signups ?? 0} signups
    </p>
  )
}

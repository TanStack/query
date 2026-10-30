'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { userOptions } from '@/app/queries'

export function UserProfile({ id }: { id: string }) {
  const { data } = useSuspenseQuery(userOptions(id))

  return <h1>{data.name}</h1>
}

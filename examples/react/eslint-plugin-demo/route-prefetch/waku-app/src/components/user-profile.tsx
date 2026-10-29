'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { useParams_UNSTABLE } from 'waku/router/client'
import { userOptions } from '../queries'

export function UserProfile() {
  const { id } = useParams_UNSTABLE<'/users/[id]'>()
  const { data: user } = useSuspenseQuery(userOptions(id))
  return <h1>{user.name}</h1>
}

'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { currentUserOptions } from '../queries'

export function Welcome() {
  const { data } = useSuspenseQuery(currentUserOptions)

  return <h1>Welcome back, {data.name}</h1>
}

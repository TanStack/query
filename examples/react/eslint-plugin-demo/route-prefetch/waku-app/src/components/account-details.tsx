'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { currentUserOptions } from '../queries'

export function AccountDetails() {
  const { data: user } = useSuspenseQuery(currentUserOptions)
  return <p>Signed in as {user.name}</p>
}

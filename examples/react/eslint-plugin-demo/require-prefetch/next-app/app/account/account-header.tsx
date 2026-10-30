'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { currentUserOptions } from '../queries'

export function AccountHeader() {
  const { data } = useSuspenseQuery(currentUserOptions)

  return <h1>{data.name}</h1>
}

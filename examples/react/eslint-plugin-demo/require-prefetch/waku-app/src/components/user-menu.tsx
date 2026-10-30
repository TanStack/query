'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from 'waku'
import { currentUserOptions } from '../queries'

export function UserMenu() {
  const { data: user } = useSuspenseQuery(currentUserOptions)
  return <Link to="/account">{user.name}</Link>
}

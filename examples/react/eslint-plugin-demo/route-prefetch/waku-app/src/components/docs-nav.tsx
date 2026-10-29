'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { docsNavOptions } from '../queries'

export function DocsNav() {
  const { data: pages } = useSuspenseQuery(docsNavOptions)
  return (
    <ul>
      {pages.map((page) => (
        <li key={page.slug}>{page.title}</li>
      ))}
    </ul>
  )
}

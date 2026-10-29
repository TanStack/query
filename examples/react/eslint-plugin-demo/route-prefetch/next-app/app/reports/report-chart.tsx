'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { reportOptions } from '../queries'

export function ReportChart() {
  const { data } = useSuspenseQuery(reportOptions)

  return (
    <ul>
      {data.map((row) => (
        <li key={row.month}>
          {row.month}: ${row.revenue}
        </li>
      ))}
    </ul>
  )
}

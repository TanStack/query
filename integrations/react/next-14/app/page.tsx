import { queryOptions, skipToken } from '@tanstack/react-query'
import React from 'react'
import { ClientComponent } from './client-component'

const options = queryOptions({
  queryKey: ['foo'],
  queryFn: skipToken,
})

export default function Home() {
  return (
    <main>
      <ClientComponent />
      Key: {JSON.stringify(options.queryKey)}
    </main>
  )
}

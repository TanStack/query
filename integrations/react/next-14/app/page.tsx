import React from 'react'
import { queryOptions } from '@tanstack/react-query'
import { ClientComponent } from './client-component'

const options = queryOptions({
  queryKey: ['foo'],
})

export default function Home() {
  return (
    <main>
      <ClientComponent />
      Key: {JSON.stringify(options.queryKey)}
    </main>
  )
}

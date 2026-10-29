'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { messagesOptions } from '../queries'

export function MessageList() {
  const { data } = useSuspenseQuery(messagesOptions)

  return (
    <ul>
      {data.map((message) => (
        <li key={message.id}>{message.subject}</li>
      ))}
    </ul>
  )
}

'use client'

import { queryOptions } from '@tanstack/react-query'

export const notificationsOptions = queryOptions({
  queryKey: ['notifications'],
  queryFn: async (): Promise<Array<{ id: string; text: string }>> => {
    const response = await fetch('https://api.example.com/notifications')
    if (!response.ok) throw new Error('Failed to fetch notifications')
    return response.json()
  },
})

import { environmentManager } from '@tanstack/react-query'

function getBaseURL() {
  if (!environmentManager.isServer()) {
    return ''
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return 'http://localhost:3000'
}
const baseUrl = getBaseURL()

export const waitAPI = {
  getWait: async (wait: number): Promise<string> => {
    const path = `/api/wait?wait=${wait}`
    const url = baseUrl + path

    const response = await fetch(url, {
      cache: 'no-store',
    })
    if (!response.ok) throw new Error('Failed to fetch data')
    return await response.json()
  },
}

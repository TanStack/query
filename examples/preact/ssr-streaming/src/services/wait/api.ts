const baseUrl = import.meta.env.SSR
  ? `http://localhost:${process.env.PORT || 5173}`
  : ''

export const waitAPI = {
  getWait: async (wait: number): Promise<string> => {
    const response = await fetch(`${baseUrl}/api/wait?wait=${wait}`)
    if (!response.ok) throw new Error('Failed to fetch data')
    return await response.json()
  },
}

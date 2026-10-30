export async function getStats(): Promise<{
  visitors: number
  signups: number
}> {
  const response = await fetch('https://api.example.com/stats')
  if (!response.ok) throw new Error('Failed to fetch stats')
  return response.json()
}

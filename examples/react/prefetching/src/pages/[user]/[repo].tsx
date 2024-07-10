import React from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { usePathname } from 'next/navigation'

async function fetchProject(id: string): Promise<{
  forks_count: number
  stargazers_count: number
  watchers_count: number
}> {
  console.info('Fetching project:', id)

  const response = await fetch(`https://api.github.com/repos/${id}`)
  await new Promise((r) => setTimeout(r, 1000))
  return await response.json()
}

export default function Repo() {
  const id = usePathname()

  const { status, data, error, isFetching } = useQuery({
    queryKey: ['team', id],
    queryFn: () => fetchProject(id),
  })

  return (
    <div style={{ textAlign: 'center' }}>
      <h1>{id}</h1>
      {status === 'pending' ? (
        'Loading...'
      ) : status === 'error' ? (
        <span>Error: {error.message}</span>
      ) : (
        <>
          <div>
            <p>forks: {data.forks_count}</p>
            <p>stars: {data.stargazers_count}</p>
            <p>watchers: {data.watchers_count}</p>
          </div>
          <div>{isFetching ? 'Background Updating...' : ' '}</div>
        </>
      )}
      <br />
      <br />
      <Link href="/">Back</Link>
    </div>
  )
}

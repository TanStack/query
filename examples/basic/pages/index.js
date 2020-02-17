import React from 'react'
import Link from 'next/link'
import fetch from '../libs/fetch'

import { useQuery } from 'react-query'

export default () => {
  const { status, data, error, isFetching } = useQuery('projects', () =>
    fetch('/api/data')
  )

  return (
    <div style={{ textAlign: 'center' }}>
      <h1>Trending Projects</h1>
      <div>
        {status === 'loading' ? (
          'Loading...'
        ) : status === 'error' ? (
          <span>Error: {error.message}</span>
        ) : (
          <>
            <div>
              {data.map(project => (
                <p key={project}>
                  <Link href="/[user]/[repo]" as={`/${project}`}>
                    <a>{project}</a>
                  </Link>
                </p>
              ))}
            </div>
            <div>{isFetching ? 'Background Updating...' : ' '}</div>
          </>
        )}
      </div>
    </div>
  )
}

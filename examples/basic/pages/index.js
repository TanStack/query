import React from 'react'
import Link from 'next/link'
import fetch from '../libs/fetch'

import { useQuery, useIsFetching } from 'react-query'

export default () => {
  const { data, isLoading, isFetching } = useQuery('projects', () =>
    fetch('/api/data')
  )

  const isGlobalFetching = useIsFetching()

  return (
    <div style={{ textAlign: 'center' }}>
      {isGlobalFetching ? 'fetching...' : null}
      <h1>Trending Projects</h1>
      <div>
        {isLoading ? (
          'Loading...'
        ) : data ? (
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
        ) : null}
      </div>
    </div>
  )
}

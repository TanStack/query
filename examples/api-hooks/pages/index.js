import React from 'react'
import Link from 'next/link'
import useProjects from '../hooks/use-projects'

export default () => {
  const { data, isLoading, isFetching } = useProjects()

  return (
    <div style={{ textAlign: 'center' }}>
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

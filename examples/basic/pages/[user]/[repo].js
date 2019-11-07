import React from 'react'
import Link from 'next/link'
import fetch from '../../libs/fetch'

import { useQuery } from 'react-query'

export default () => {
  const id =
    typeof window !== 'undefined' ? window.location.pathname.slice(1) : ''

  const { data, isLoading, isFetching } = useQuery(['repository', { id }], () =>
    fetch('/api/data?id=' + id)
  )

  return (
    <div style={{ textAlign: 'center' }}>
      <h1>{id}</h1>
      {isLoading ? (
        'Loading...'
      ) : data ? (
        <>
          <div>
            <p>forks: {data.forks_count}</p>
            <p>stars: {data.stargazers_count}</p>
            <p>watchers: {data.watchers}</p>
          </div>
          <div>{isFetching ? 'Background Updating...' : ' '}</div>
        </>
      ) : null}
      <br />
      <br />
      <Link href="/">
        <a>Back</a>
      </Link>
    </div>
  )
}

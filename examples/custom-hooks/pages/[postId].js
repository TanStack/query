import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

//

import usePost from '../hooks/usePost'

export default () => {
  const {
    query: { postId },
  } = useRouter()

  const { status, data, error, isFetching } = usePost(postId)

  return (
    <div>
      <div>
        <Link href="/">
          <a>Back</a>
        </Link>
      </div>
      {!postId || status === 'loading' ? (
        'Loading...'
      ) : status === 'error' ? (
        <span>Error: {error.message}</span>
      ) : (
        <>
          <h1>{data.title}</h1>
          <div>
            <p>{data.body}</p>
          </div>
          <div>{isFetching ? 'Background Updating...' : ' '}</div>
        </>
      )}
    </div>
  )
}

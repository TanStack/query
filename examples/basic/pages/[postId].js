import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import axios from 'axios'

import { useQuery } from 'react-query'

export default () => {
  const {
    query: { postId },
  } = useRouter()

  const { status, data, error, isFetching } = useQuery(
    postId && ['post', postId],
    async (key, id) => {
      const { data } = await axios.get(
        `https://jsonplaceholder.typicode.com/posts/${id}`
      )
      return data
    }
  )

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

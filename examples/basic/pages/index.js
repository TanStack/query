import React from 'react'
import Link from 'next/link'
import axios from 'axios'

import { useQuery } from 'react-query'

export default () => {
  const { status, data, error, isFetching } = useQuery('posts', async () => {
    const { data } = await axios.get(
      'https://jsonplaceholder.typicode.com/posts'
    )
    return data
  })

  return (
    <div>
      <h1>Posts</h1>
      <p>
        As you visit the posts below, you will notice them in a loading state
        the first time you load them. However, after you return to this list and
        click on any posts you have already visited again, you will see them
        load instantly and background refresh right before your eyes!{' '}
        <strong>
          (You may need to throttle your network speed to simulate longer
          loading sequences)
        </strong>
      </p>
      <div>
        {status === 'loading' ? (
          'Loading...'
        ) : status === 'error' ? (
          <span>Error: {error.message}</span>
        ) : (
          <>
            <div>
              {data.map(post => (
                <p key={post.id}>
                  <Link href="/[postId]" as={`/${post.id}`}>
                    <a>{post.title}</a>
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

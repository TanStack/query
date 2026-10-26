import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { postsQueries } from '../services/posts/queries'

export const PostList = () => {
  const [postCount, setPostCount] = useState(10)
  const { data, error, isPending, isError, isFetching } = useQuery(
    postsQueries.list(postCount),
  )

  if (isPending) return <div>Loading</div>

  if (isError) return <div>Error: {error.message}</div>

  return (
    <section>
      <ul>
        {data.map((post, index) => (
          <li key={post.id}>
            {index + 1}. {post.title}
          </li>
        ))}
      </ul>
      {postCount <= 90 && (
        <button
          onClick={() => setPostCount(postCount + 10)}
          disabled={isFetching}
        >
          {isFetching ? 'Loading...' : 'Show More'}
        </button>
      )}
      <style jsx>{`
        section {
          padding-bottom: 20px;
        }
        li {
          display: block;
          margin-bottom: 10px;
        }
        div {
          align-items: center;
          display: flex;
        }
        a {
          font-size: 14px;
          margin-right: 10px;
          text-decoration: none;
          padding-bottom: 0;
          border: 0;
        }
        span {
          font-size: 14px;
          margin-right: 5px;
        }
        ul {
          margin: 0;
          padding: 0;
        }
        button:before {
          align-self: center;
          border-style: solid;
          border-width: 6px 4px 0 4px;
          border-color: #ffffff transparent transparent transparent;
          content: '';
          height: 0;
          margin-right: 5px;
          width: 0;
        }
      `}</style>
    </section>
  )
}

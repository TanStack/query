import React from 'react'

export const PostList = () => {
  let error = false
  let loading = false

  // if (error) return <ErrorMessage message="Error loading posts." />
  if (loading) return <div>Loading</div>

  return (
    <section>
      <ul>
        {/* {allPosts.map((post, index) => (
          <li key={post.id}>
            <div>
              <span>{index + 1}. </span>
              <a href={post.url}>{post.title}</a>
              <PostUpvoter id={post.id} votes={post.votes} />
            </div>
          </li>
        ))} */}
        <li>
          <div>
            <span>1</span>
            <a href="#">Title</a>
          </div>
        </li>
      </ul>
      {/* {areMorePosts && (
        <button onClick={() => loadMorePosts()} disabled={loadingMorePosts}>
          {loadingMorePosts ? 'Loading...' : 'Show More'}
        </button>
      )} */}
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

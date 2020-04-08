import React from 'react'
import { useQuery, ReactQueryConfigProvider } from '..'

const queryConfig = {
  manual: true,
}

const fetchUser = () => Promise.resolve({ userId: 1, username: 'Test' })
const fetchPosts = () => Promise.resolve([{ postId: 1, body: 'Hello' }])

const UserProfile = () => {
  const { data: user } = useQuery(['user', 1], fetchUser)

  if (user) {
    return <div>User: {user.username}</div>
  } else {
    return <div>Loading user...</div>
  }
}

const PostsByUser = () => {
  const { data } = useQuery(['posts', 1], fetchPosts)

  if (data) {
    return (
      <div>
        {data.map(post => (
          <div key={post.postId}>Post: {post.body}</div>
        ))}
      </div>
    )
  }

  return null
}

export const Page = ({ onAfterHide }) => {
  const [showContent, setShowContent] = React.useState(false)

  return (
    <ReactQueryConfigProvider config={queryConfig}>
      <div className="App">
        <h1>Hello CodeSandbox</h1>
        <p>
          <button
            data-testid="showContent"
            onClick={() => setShowContent(true)}
          >
            Show Modal
          </button>
        </p>

        {showContent && (
          <div>
            <UserProfile />
            <PostsByUser />
            <p>
              <button
                data-testid="hideContent"
                onClick={() => {
                  setShowContent(false)
                  if (onAfterHide) onAfterHide()
                }}
              >
                Close Modal
              </button>
            </p>
          </div>
        )}
      </div>
    </ReactQueryConfigProvider>
  )
}

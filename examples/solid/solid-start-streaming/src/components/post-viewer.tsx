import { useQuery } from '@tanstack/solid-query'
import { resetErrorBoundaries } from 'solid-js'
import { createSignal } from 'solid-js'
import { For } from 'solid-js'
import { Example } from './example'
import { QueryBoundary } from './query-boundary'
import type { Component } from 'solid-js'
import { fetchPost } from '~/utils/api'

export interface PostViewerProps {
  deferStream?: boolean
  sleep?: number
  simulateError?: boolean
}

export const PostViewer: Component<PostViewerProps> = (props) => {
  const [simulateError, setSimulateError] = createSignal(props.simulateError)
  const [postId, setPostId] = createSignal(1)

  const query = useQuery(() => ({
    queryKey: ['posts', postId()],
    queryFn: () =>
      fetchPost({
        postId: postId(),
        sleep: props.sleep,
        simulateError:
          simulateError() || (simulateError() !== false && postId() === 5),
      }),
    deferStream: props.deferStream,
    throwOnError: true,
  }))

  return (
    <Example
      title="Post Query"
      deferStream={props.deferStream}
      sleep={props.sleep}
    >
      <div style={{ 'margin-top': '20px' }}>
        <button
          onClick={() => {
            setPostId(Math.max(postId() - 1, 1))
            resetErrorBoundaries()
          }}
        >
          Previous Post
        </button>
        <button
          onClick={() => {
            setPostId(Math.min(postId() + 1, 100))
            resetErrorBoundaries()
          }}
        >
          Next Post
        </button>
      </div>

      {/* NOTE: without this extra wrapping div, for some reason solid ends up printing two errors... feels like a bug in solid. */}
      <div>
        <QueryBoundary
          query={query}
          loadingFallback={<div class="loader">loading post...</div>}
          errorFallback={(err, retry) => (
            <div>
              <div class="error">{err.message}</div>
              <button
                onClick={() => {
                  setSimulateError(false)
                  retry()
                }}
              >
                retry
              </button>
            </div>
          )}
        >
          {(posts) => (
            <For each={posts}>
              {(post) => (
                <div style={{ 'margin-top': '20px' }}>
                  <b>
                    [post {postId()}] {post.title}
                  </b>
                  <p>{post.body}</p>
                </div>
              )}
            </For>
          )}
        </QueryBoundary>
      </div>
    </Example>
  )
}

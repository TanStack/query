import { gql, request } from 'graphql-request'
import type { Post } from './types'

const endpoint = 'https://graphqlzero.almansi.me/api'

export const postsAPI = {
  getPosts: async (): Promise<Array<Post>> => {
    const {
      posts: { data },
    } = await request<{ posts: { data: Array<Post> } }>(
      endpoint,
      gql`
        query {
          posts {
            data {
              id
              title
            }
          }
        }
      `,
    )
    return data
  },
  getPost: async (postId: string): Promise<Post> => {
    const { post } = await request<{ post: Post }>(
      endpoint,
      gql`
        query Post($id: ID!) {
          post(id: $id) {
            id
            title
            body
          }
        }
      `,
      { id: postId },
    )

    return post
  },
}

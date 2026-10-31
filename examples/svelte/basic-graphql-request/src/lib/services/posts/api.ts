import { gql, request } from 'graphql-request'
import type { Post } from './types'

const endpoint = 'https://graphqlzero.almansi.me/api'

export const postsAPI = {
  getPosts: async (): Promise<Array<Pick<Post, 'id' | 'title'>>> => {
    const {
      posts: { data },
    } = await request<{
      posts: { data: Array<Pick<Post, 'id' | 'title'>> }
    }>(
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

import { print } from 'graphql'
import { gql } from 'graphql-request'
import { queryVerbFetch } from './query-verb'
import type { DocumentNode } from 'graphql'
import type { Post } from './types'

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env

const endpoint =
  env?.VITE_GQL_ENDPOINT ?? 'https://graphqlzero.almansi.me/api'

type GraphQLResponse<TData> = {
  data?: TData
  errors?: Array<{ message: string }>
}

/**
 * GraphQL-over-HTTP JSON request. Stays on POST unless the QUERY verb
 * (RFC 10008) is enabled and available for the endpoint — see `query-verb.ts`.
 * This is a query read only; mutations must not use it.
 */
async function gqlRequest<TData>(
  document: string | DocumentNode,
  variables?: Record<string, unknown>,
): Promise<TData> {
  const response = await queryVerbFetch(endpoint, {
    method: 'POST',
    mediaType: 'application/json',
    headers: {
      accept: 'application/graphql-response+json, application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      query: typeof document === 'string' ? document : print(document),
      variables,
    }),
  })

  if (!response.ok) {
    throw new Error(`GraphQL request failed with status ${response.status}`)
  }

  const payload: GraphQLResponse<TData> = await response.json()

  if (payload.errors?.length) {
    throw new Error(payload.errors[0].message)
  }

  if (!payload.data) {
    throw new Error('GraphQL response did not contain any data')
  }

  return payload.data
}

export const postsAPI = {
  getPosts: async (): Promise<Array<Pick<Post, 'id' | 'title'>>> => {
    const { posts } = await gqlRequest<{
      posts: { data: Array<Pick<Post, 'id' | 'title'>> }
    }>(gql`
      query {
        posts {
          data {
            id
            title
          }
        }
      }
    `)

    return posts.data
  },
  getPost: async (postId: string): Promise<Post> => {
    const { post } = await gqlRequest<{ post: Post }>(
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

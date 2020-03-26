import { useQuery } from 'react-query'
import axios from 'axios'

export default function usePosts(postId) {
  return useQuery(['post', postId], async (_, postId) => {
    const { data } = await axios.get(
      `https://jsonplaceholder.typicode.com/posts/${postId}`
    )
    return data
  })
}

import { useQuery } from "react-query";
import axios from "axios";

const getPostById = async (postId) => {
  const { data } = await axios.get(
    `https://jsonplaceholder.typicode.com/posts/${postId}`
  );
  return data;
};

export default function usePost(postId) {
  return useQuery(["post", postId], () => getPostById(postId));
}

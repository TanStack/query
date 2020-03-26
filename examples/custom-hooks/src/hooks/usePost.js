import { useQuery } from "react-query";
import axios from "axios";

const getPostById = async (_, postId) => {
  const { data } = await axios.get(
    `https://jsonplaceholder.typicode.com/posts/${postId}`
  );
  return data;
};

export default function usePosts(postId) {
  return useQuery(["post", postId], getPostById);
}

import { useQuery } from "react-query";
import axios from "axios";

const getPosts = async () => {
  const { data } = await axios.get(
    "https://jsonplaceholder.typicode.com/posts"
  );
  return data;
};

export default function usePosts() {
  return useQuery("posts", getPosts);
}

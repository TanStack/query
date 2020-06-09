/* eslint-disable jsx-a11y/anchor-is-valid */
import React from "react";
import ReactDOM from "react-dom";
import { useQuery } from "react-query";

const fetchUrl = async (url) => {
  // Step 1: Fetch the data from the given url
  const response = await fetch(url);
  try {
    // Step 2: Grab the contents of the request, here we are assuming
    // it's in JSON format
    const json = await response.json();
    // Step 3: Return the data in the format you want to use in your `react-query`-hooks
    return { data: json };
  } catch (error) {
    // If an error occurred while converting the data to json we return undefined
    return undefined;
  }
};

const getPosts = async () => {
  const { data } = await fetchUrl("https://jsonplaceholder.typicode.com/posts");
  return data;
};

const getPostById = async (key, id) => {
  const { data } = await fetchUrl(
    `https://jsonplaceholder.typicode.com/posts/${id}`
  );
  return data;
};

function App() {
  const [postId, setPostId] = React.useState(-1);

  return (
    <>
      <p>
        As you visit the posts below, you will notice them in a loading state
        the first time you load them. However, after you return to this list and
        click on any posts you have already visited again, you will see them
        load instantly and background refresh right before your eyes!{" "}
        <strong>
          (You may need to throttle your network speed to simulate longer
          loading sequences)
        </strong>
      </p>
      {postId > -1 ? (
        <Post postId={postId} setPostId={setPostId} />
      ) : (
        <Posts setPostId={setPostId} />
      )}
    </>
  );
}

function Posts({ setPostId }) {
  const { status, data, error, isFetching } = useQuery("posts", getPosts);

  return (
    <div>
      <h1>Posts</h1>
      <div>
        {status === "loading" ? (
          "Loading..."
        ) : status === "error" ? (
          <span>Error: {error.message}</span>
        ) : (
          <>
            <div>
              {data.map((post) => (
                <p key={post.id}>
                  <a onClick={() => setPostId(post.id)} href="#">
                    {post.title}
                  </a>
                </p>
              ))}
            </div>
            <div>{isFetching ? "Background Updating..." : " "}</div>
          </>
        )}
      </div>
    </div>
  );
}

function Post({ postId, setPostId }) {
  const { status, data, error, isFetching } = useQuery(
    postId && ["post", postId],
    getPostById
  );

  return (
    <div>
      <div>
        <a onClick={() => setPostId(-1)} href="#">
          Back
        </a>
      </div>
      {!postId || status === "loading" ? (
        "Loading..."
      ) : status === "error" ? (
        <span>Error: {error.message}</span>
      ) : (
        <>
          <h1>{data.title}</h1>
          <div>
            <p>{data.body}</p>
          </div>
          <div>{isFetching ? "Background Updating..." : " "}</div>
        </>
      )}
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);

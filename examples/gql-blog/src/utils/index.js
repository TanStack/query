import { GraphQLClient } from "graphql-request";

const endpoint = "https://best-markdown-editor-be.herokuapp.com/cms";

export const client = new GraphQLClient(endpoint, {
  headers: {
    "Content-Type": "application/json",
    token: "588c454c-7176-457e-9d42-ad6d0e7ffdc4",
  },
});

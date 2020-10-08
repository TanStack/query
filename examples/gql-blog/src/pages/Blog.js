import React from "react";
import { useQuery } from "react-query";
import { Card, Box } from "sriracha-ui";
import { client } from "../utils";
import { gql } from "graphql-request";
import { useParams } from "react-router";
import ReactMarkdown from "react-markdown";
import { PrismAsync as SyntaxHighlighter } from "react-syntax-highlighter";
import dark from "../syntaxTheme";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const CodeBlock = ({ language, value }) => {
  return (
    <SyntaxHighlighter style={dark} language={language}>
      {value}
    </SyntaxHighlighter>
  );
};

const query = gql`
  query GetPubFileBySlug($slug: String!) {
    getPubFileBySlug(slug: $slug) {
      body
    }
  }
`;

export default function Blog() {
  const { slug } = useParams();

  const { data, isLoading, status } = useQuery("posts", async () => {
    const res = await client.request(query, { slug });
    return res;
  });

  const file = data?.getPubFileBySlug;
  console.log("file:", file);

  if (status === "error")
    return (
      <Card>
        The blog your looking for doesn't exist or was deleted by the user.
      </Card>
    );

  return (
    <Card maxW={9} w="96%" shade tal pb="4rem">
      <Box maxW="100%">
        {isLoading ? (
          <FontAwesomeIcon icon="spinner" spin size="3x" />
        ) : (
          <ReactMarkdown
            className="markdown-body"
            escapeHtml={false}
            source={file?.body}
            renderers={{ code: CodeBlock }}
          />
        )}
      </Box>
    </Card>
  );
}

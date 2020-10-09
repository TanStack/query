import React from "react";
import { Card, Text, Box, Flex, Img } from "sriracha-ui";
import { Link } from "react-router-dom";
import { gql } from "graphql-request";
import { client } from "../utils";
import { useQuery } from "react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const query = gql`
  query GetPubFiles {
    getPubFiles {
      id
      slug
      title
      description
      thumbnail
      body
    }
  }
`;

export default function Home() {
  const { data, isLoading } = useQuery("posts", async () => {
    const res = await client.request(query);
    return res;
  });
  const files = data?.getPubFiles;
  return (
    <Card maxW={9} w="96%" shade>
      <Text color="red6" size="5xl" as="h1" tac font="Raleway">
        Welcome To My Blog!
      </Text>
      <Text color="indigo6" size="xl" as="h2" tac font="Raleway">
        Powered by{" "}
        <Text as="a" size="xl" href="https://sriracha-docs.vercel.app/">
          Sriracha UI
        </Text>
        ,{" "}
        <Text as="a" size="xl" href="https://www.bestmarkdowneditor.com/">
          Best Markdown Editor{" "}
        </Text>
        and{" "}
        <Text as="a" size="xl" href="https://react-query.tanstack.com/">
          React Query
        </Text>
        !
        <Box stretch h="0.1rem" bg="indigo6" />
      </Text>
      <Flex maxW="71rem" w="96%" wrap="true" m="4rem 0" jcc>
        {isLoading ? (
          <FontAwesomeIcon icon="spinner" spin size="3x" />
        ) : (
          <>
            {files?.map((file) => (
              <Card
                as="a"
                href={`/${file.slug}`}
                w="32rem"
                maxW="96%"
                p="2rem 1rem"
                bg="gray1"
                shade
                sink
                hvrColor="gray9"
                pointer="true"
                key={file.id}
              >
                <Text size="xl" bold pointer="true">
                  {file.title}
                </Text>
                <Img
                  w="30rem"
                  maxW="100%"
                  src={file.thumbnail}
                  alt="preview"
                  pointer
                />
                <Text pointer>{file.description}</Text>
              </Card>
            ))}
          </>
        )}
      </Flex>
    </Card>
  );
}

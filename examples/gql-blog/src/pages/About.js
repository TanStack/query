import React from "react";
import { Card, Text } from "sriracha-ui";

export default function About() {
  return (
    <Card maxW={9} w="96%" shade>
      <Text color="red6" size="5xl" as="h1" tac font="Raleway">
        About page
      </Text>
      <Text as="p">
        This is a simple blog created using React Query to manage all of our
        server state from Best Markdown Editor.
      </Text>
    </Card>
  );
}

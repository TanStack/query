import React from "react";
import { Flex, Text } from "sriracha-ui";
import { Link } from "react-router-dom";

export default function NavLink({ link }) {
  return (
    <Flex aic wrap="true" pointer>
      <Link to={link === "Home" ? "/" : `/${link.toLowerCase()}`}>
        <Text lf pointer color="gray9" hvrColor="gray5">
          {link}
        </Text>
      </Link>
    </Flex>
  );
}

import React from "react";
import { Box } from "sriracha-ui";
import NavLink from "./NavLink";

export default function NavLinks() {
  const links = ["Home", "About"];
  return (
    <>
      {links.map((link) => (
        <React.Fragment key={link}>
          <NavLink link={link} />
          <Box w="2rem" />
        </React.Fragment>
      ))}
    </>
  );
}

import React from "react";
import {
  Wrapper,
  NavBar,
  Box,
  Flex,
  Cabinet,
  useCabinet,
  useTheme,
} from "sriracha-ui";
import NavLinks from "./NavLinks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const navHeight = "5rem";

export default function Layout({ children }) {
  const { isCabinet, toggleCabinet } = useCabinet();
  const { toggleTheme, themeString, lightTheme } = useTheme();
  const { colors } = lightTheme;
  return (
    <Wrapper>
      <header>
        <NavBar w="100%" bg="gray0" drape shadow={3} radius="0 0 0.4rem 0.4rem">
          <Flex w="100%" jcb aic h={navHeight}>
            <Box
              className="nav-cabinet-menu"
              m="0 0 0 2rem"
              pointer
              onClick={toggleCabinet}
            >
              <Flex drape w="2.2rem">
                <Box h="0.2rem" w="2rem" bg="gray9" />
                <Box h="0.5rem" />
                <Box h="0.2rem" w="2rem" bg="gray9" />
                <Box h="0.5rem" />
                <Box h="0.2rem" w="2rem" bg="gray9" />
              </Flex>
            </Box>
            <Box className="nav-link-list">
              <Flex m="0 0 0 2rem">
                <NavLinks />
              </Flex>
            </Box>
            <Flex
              as="button"
              onClick={toggleTheme}
              jcv
              aic
              p={1}
              mr={3}
              bg="none"
              radius="0.5rem"
              hvrBg="gray2"
            >
              {themeString === "dark" ? (
                <FontAwesomeIcon icon="sun" color={colors.amber3} size="lg" />
              ) : (
                <FontAwesomeIcon icon="moon" color={colors.purple7} size="lg" />
              )}
            </Flex>
          </Flex>
        </NavBar>
      </header>
      <Cabinet active={isCabinet} toggle={toggleCabinet} shade>
        <Flex drape h="15rem" jcv>
          <NavLinks toggleCabinet={toggleCabinet} />
        </Flex>
      </Cabinet>
      <Flex drape stretch>
        <Box h={navHeight} />
        <Box />
        {children}
      </Flex>
    </Wrapper>
  );
}

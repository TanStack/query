import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider } from "@material-ui/core";
import { createMuiTheme } from "@material-ui/core/styles";

import { QueryCache, ReactQueryCacheProvider } from "react-query";
import { ReactQueryDevtools } from "react-query-devtools";

import "./styles.css";
import Layout from "./Layout";

const queryCache = new QueryCache();

export default function App() {
  return (
    <ReactQueryCacheProvider queryCache={queryCache}>
      <Router>
        <ThemeProvider theme={theme}>
          <Layout />
          <ReactQueryDevtools initialIsOpen />
        </ThemeProvider>
      </Router>
    </ReactQueryCacheProvider>
  );
}

const theme = createMuiTheme({
  typography: {
    h1: {
      fontFamily: "Roboto Mono, monospace",
    },
    h2: {
      fontFamily: "Roboto Mono, monospace",
    },
    h3: {
      fontFamily: "Roboto Mono, monospace",
    },
    h4: {
      fontFamily: "Roboto Mono, monospace",
    },
    h5: {
      fontFamily: "Roboto Mono, monospace",
    },
    h6: {
      fontFamily: "Roboto Mono, monospace",
    },
  },
});

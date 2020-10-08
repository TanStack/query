import React from "react";

import { Switch, Route } from "react-router";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Blog from "./pages/Blog";

import { AppContainer, useDarkMode } from "sriracha-ui";

import { library } from "@fortawesome/fontawesome-svg-core";
import { faMoon, faSun, faSpinner } from "@fortawesome/free-solid-svg-icons";
import About from "./pages/About";

library.add(faMoon, faSun, faSpinner);

function App() {
  const { themeString, toggleTheme } = useDarkMode();

  return (
    <AppContainer themeString={themeString} toggleTheme={toggleTheme}>
      <Layout>
        <Switch>
          <Route exact path="/" component={Home} />
          <Route exact path="/about" component={About} />
          <Route exact path="/:slug" component={Blog} />
        </Switch>
      </Layout>
    </AppContainer>
  );
}

export default App;

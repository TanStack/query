import React from "react";
import Episodes from "./Episodes";
import Episode from "./Episode";
import Characters from "./Characters";
import Character from "./Character";
import Home from "./Home";
import { Link, Button } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Switch, Route, Link as RouterLink } from "react-router-dom";

export default function Layout() {
  const classes = useStyles();

  return (
    <div className="App">
      <nav className={classes.menu}>
        <Link component={RouterLink} to="/">
          <Button color="primary">Home</Button>
        </Link>
        <Link component={RouterLink} to="/episodes">
          <Button color="primary">Episodes</Button>
        </Link>
        <Link component={RouterLink} to="/characters">
          <Button color="primary">Characters</Button>
        </Link>
      </nav>
      <main className={classes.main}>
        <Switch>
          <Route exact path="/episodes">
            <Episodes />
          </Route>
          <Route exact path="/episodes/:episodeId">
            <Episode />
          </Route>
          <Route exact path="/characters">
            <Characters />
          </Route>
          <Route exact path="/characters/:characterId">
            <Character />
          </Route>
          <Route path="/">
            <Home />
          </Route>
        </Switch>
      </main>
    </div>
  );
}

const useStyles = makeStyles(theme => ({
  main: {
    margin: "0 auto",
    padding: "16px"
  },
  menu: {
    margin: "0 auto",
    display: "flex",
    justifyContent: "center",
    backgroundColor: "#CCC",
    "& button": {
      margin: theme.spacing(1)
    }
  }
}));

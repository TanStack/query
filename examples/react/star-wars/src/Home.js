import React from "react";
import { Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Link } from "@material-ui/core";
import { Link as RouterLink } from "react-router-dom";

export default function Home(props) {
  const classes = useStyles();

  return (
    <div>
      <Typography variant="h2">React Query Demo</Typography>
      <Typography variant="subtitle1">Using the Star Wars API</Typography>
      <Typography variant="subtitle2">
        (Built by <a href="https://twitter.com/Brent_m_Clark">@Brent_m_Clark</a>
        )
      </Typography>
      <section className={classes.main}>
        <Typography variant="h5">Why React Query?</Typography>
        <Typography variant="body1">
          In this demo you will be able to see how React Query is a significant
          improvement over <strong>redux</strong>, <strong>mobx</strong>, and
          any other general-purpose state container.
        </Typography>
        <Typography variant="body1">
          No reducers, thunks, or sagas. No ES6 models to maintain in order to
          tag them as observable.
        </Typography>
        <Typography variant="body1">
          Simply associate a key with your fetch call and let{" "}
          <strong>React Query</strong> handle the rest.
        </Typography>
        <Typography variant="h5">Ready to get started?</Typography>
        <Typography variant="body1">
          Check out the{" "}
          <Link component={RouterLink} to="/films">
            Films
          </Link>{" "}
          and{" "}
          <Link component={RouterLink} to="/characters">
            Characters
          </Link>
          !
        </Typography>
      </section>
    </div>
  );
}

const useStyles = makeStyles(theme => ({
  main: {
    margin: "44px 0",
    "& p": {
      margin: "12px 0 24px"
    }
  }
}));

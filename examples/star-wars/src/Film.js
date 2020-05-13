import React from "react";
import { Typography, Link } from "@material-ui/core";
import { Link as RouterLink } from "react-router-dom";
import { withRouter } from "react-router";
import { useQuery } from "react-query";
import fetch from "./fetch";

function Film(props) {
  const filmId = props.match.params.filmId;
  const { data, status, error } = useQuery(`film-${filmId}`, () =>
    fetch(`https://swapi.dev/api/films/${filmId}/`)
  );

  if (status === "loading") return <p>Loading...</p>;
  // this will not be necessary when v1 is released.
  if (data == null) {
    console.info("this shouldn't happen but it does 2");
    return <p>Loading...</p>;
  }
  if (status === "error") return <p>Error :(</p>;
  return (
    <div>
      <Typography variant="h2">{data.title}</Typography>
      <Typography variant="body1">{data.opening_crawl}</Typography>
      <br />
      <Typography variant="h4">Characters</Typography>
      {data.characters.map((character) => {
        const characterUrlParts = character.split("/").filter(Boolean);
        const characterId = characterUrlParts[characterUrlParts.length - 1];
        return <Character id={characterId} key={characterId} />;
      })}
    </div>
  );
}

function Character(props) {
  const { id } = props;
  const { data, status, error } = useQuery(`character-${id}`, () =>
    fetch(`https://swapi.dev/api/people/${props.id}/`)
  );

  if (status !== "success") {
    return null;
  }

  return (
    <article key={id}>
      <Link component={RouterLink} to={`/characters/${id}`}>
        <Typography variant="h6">{data.name}</Typography>
      </Link>
    </article>
  );
}

export default withRouter(Film);

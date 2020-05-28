import React from "react";
import {
  Typography,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@material-ui/core";
import { Link as RouterLink } from "react-router-dom";
import { withRouter } from "react-router";
import { useQuery } from "react-query";
import fetch from "./fetch";

function Character(props) {
  const characterId = props.match.params.characterId;
  const { status, error, data } = useQuery(`character-${characterId}`, () =>
    fetch(`https://swapi.dev/api/people/${characterId}/`)
  );

  if (status === "loading") return <p>Loading...</p>;
  if (status === "error") return <p>Error :(</p>;

  console.info({ data, status, error });
  const homeworldUrlParts = data.homeworld.split("/").filter(Boolean);
  const homeworldId = homeworldUrlParts[homeworldUrlParts.length - 1];

  if (status !== "success") {
    return null;
  }
  return (
    <div>
      <Typography variant="h2">{data.name}</Typography>
      <TableContainer component={Paper} style={{ maxWidth: "400px" }}>
        <Table size="small" aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Feature</TableCell>
              <TableCell>Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Born</TableCell>
              <TableCell>{data.birth_year}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Eyes</TableCell>
              <TableCell>{data.eye_color}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Hair</TableCell>
              <TableCell>{data.hair_color}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Height</TableCell>
              <TableCell>{data.height}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Mass</TableCell>
              <TableCell>{data.mass}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Homeworld</TableCell>
              <TableCell>
                <Homeworld id={homeworldId} />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <br />
      <Typography variant="h4">Films</Typography>
      {data.films.map((film) => {
        const filmUrlParts = film.split("/").filter(Boolean);
        const filmId = filmUrlParts[filmUrlParts.length - 1];
        return <Film id={filmId} key={`Film-${filmId}`} />;
      })}
    </div>
  );
}

function Film(props) {
  const { id } = props;
  const { data, status, error } = useQuery(`film-${id}`, () =>
    fetch(`https://swapi.dev/api/films/${id}/`)
  );

  if (status !== "success") {
    return null;
  }
  return (
    <article key={id}>
      <Link component={RouterLink} to={`/films/${id}`}>
        <Typography variant="h6">
          {data.episode_id}. {data.title}
        </Typography>
      </Link>
    </article>
  );
}

function Homeworld(props) {
  const { id } = props;
  const { data, status } = useQuery(`homeworld-${id}`, () =>
    fetch(`https://swapi.dev/api/planets/${id}/`)
  );

  if (status !== "success") {
    return null;
  }

  return data.name;
}

export default withRouter(Character);

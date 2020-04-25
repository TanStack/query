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
  Paper
} from "@material-ui/core";
import { Link as RouterLink } from "react-router-dom";
import { useParams } from "react-router";
import { useQuery } from "react-query";
import fetch from "./fetch";

function Character() {
  const { characterId } = useParams();
  const { status, data } = useQuery(`character-${characterId}`, () =>
    fetch(`https://rickandmortyapi.com/api/character/${characterId}`)
  );

  if (status === "loading") return <p>Loading...</p>;
  if (status === "error") return <p>Error :(</p>;

  const locationUrlPars = data.location.url.split("/").filter(Boolean);
  const locationId = locationUrlPars[locationUrlPars.length - 1];

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
              <TableCell>Gender</TableCell>
              <TableCell>{data.gender}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell>{data.status}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Species</TableCell>
              <TableCell>{data.species}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Origin</TableCell>
              <TableCell>{data.origin.name}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Location</TableCell>
              <TableCell>
                <Location id={locationId} />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <br />
      <Typography variant="h4">Episodes</Typography>
      {data.episode.map(episode => {
        const episodeUrlParts = episode.split("/").filter(Boolean);
        const episodeId = episodeUrlParts[episodeUrlParts.length - 1];

        return <Episode id={episodeId} key={`episode-${episodeId}`} />;
      })}
    </div>
  );
}

function Episode({ id }) {
  const { data, status } = useQuery(`episode-${id}`, () =>
    fetch(`https://rickandmortyapi.com/api/episode/${id}`)
  );

  if (status !== "success") {
    return null;
  }

  return (
    <article key={id}>
      <Link component={RouterLink} to={`/episodes/${id}`}>
        <Typography variant="h6">
          {data.episode}. {data.name} - {data.air_date}
        </Typography>
      </Link>
    </article>
  );
}

function Location({ id }) {
  const { data, status } = useQuery(`location-${id}`, () =>
    fetch(`https://rickandmortyapi.com/api/location/${id}`)
  );

  if (status === "loading") return <p>Loading...</p>;
  if (status === "error") return <p>Error :(</p>;

  return (
    <>
      {data.name} - {data.type}
    </>
  );
}

export default Character;

import React from "react";
import { Typography, Link } from "@material-ui/core";
import { Link as RouterLink } from "react-router-dom";
import { useQuery } from "react-query";
import fetch from "./fetch";

export default function Episodes() {
  const { data, status } = useQuery(
    "episodes",
    () => fetch("https://rickandmortyapi.com/api/episode"),
    {
      refetchInterval: 3 * 1000,
      cacheTime: 2000,
    }
  );

  if (status === "loading") {
    return <p>Loading...</p>;
  }
  if (status === "error") {
    return <p>Error :(</p>;
  }

  return (
    <div>
      <Typography variant="h2">Episodes</Typography>
      {data.results.map((episode) => (
        <article key={episode.id}>
          <Link component={RouterLink} to={`/episodes/${episode.id}`}>
            <Typography variant="h6">
              {episode.episode} - {episode.name} <em>{episode.airDate}</em>
            </Typography>
          </Link>
        </article>
      ))}
    </div>
  );
}

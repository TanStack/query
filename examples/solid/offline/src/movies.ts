import {
  createMutation,
  createQuery,
  useQueryClient,
} from "@tanstack/solid-query";

import type { Movie } from "./api"

type QueryData = {
  movie: Movie,
}

import * as api from "./api";
import * as React from "react";

// query key factory
export const movieKeys = {
  all: () => ["movies"],
  list: () => [...movieKeys.all(), "list"],
  details: () => [...movieKeys.all(), "detail"],
  detail: (id: string) => [...movieKeys.details(), id],
};

export const useMovie = (movieId: string) => {
  const queryClient = useQueryClient();

  const movieQuery = createQuery(
    () => movieKeys.detail(movieId),
    () => api.fetchMovie(movieId)
  );

  const [comment, setComment] = React.useState();

  const updateMovie = createMutation({
    mutationKey: movieKeys.detail(movieId),
    onMutate: async () => {
      await queryClient.cancelQueries(movieKeys.detail(movieId));
      const previousData: QueryData = queryClient.getQueryData(movieKeys.detail(movieId))!;

      // remove local state so that server state is taken instead
      setComment(undefined);

      queryClient.setQueryData(movieKeys.detail(movieId), {
        ...previousData,
        movie: {
          ...previousData.movie,
          comment,
        },
      });

      return { previousData };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(movieKeys.detail(movieId), context?.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries(movieKeys.detail(movieId));
    },
  });

  return {
    comment: comment ?? movieQuery.data?.movie.comment,
    setComment,
    updateMovie,
    movieQuery,
  };
};

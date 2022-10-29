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
import { createSignal } from "solid-js";

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

  // local value in <form>
  const [commentLocal, setCommentLocal] = createSignal<string | undefined>("");

  const updateMovie = createMutation({
    mutationKey: movieKeys.detail(movieId),
    onMutate: async () => {
      await queryClient.cancelQueries(movieKeys.detail(movieId));
      const previousData: QueryData = queryClient.getQueryData(movieKeys.detail(movieId))!;

      // remove local state so that server state is taken instead
      setCommentLocal(undefined);

      queryClient.setQueryData(movieKeys.detail(movieId), {
        ...previousData,
        movie: {
          ...previousData.movie,
          comment: commentLocal(),
        },
      });

      return { previousData };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(movieKeys.detail(movieId), context?.previousData);
    },
    onSettled: () => {
      // refetch -> update movieQuery.data.movie.comment
      queryClient.invalidateQueries(movieKeys.detail(movieId));

      // remove local state so that server state is taken instead
      // TODO do this after a successful refetch
      setCommentLocal(undefined);
    },
    onSuccess(data: any, _variables, _context) {
      console.log('updateMovie onSuccess: data.message', data.message)
    },
  });

  return {
    comment: () => commentLocal() ?? movieQuery.data?.movie.comment,
    setComment: setCommentLocal,
    updateMovie,
    movieQuery,
  };
};

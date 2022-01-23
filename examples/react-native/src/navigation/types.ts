import { Movie } from '@app/lib/api';

export type MoviesStackNavigator = {
  MoviesList: undefined;
  MovieDetails: { movie: Movie };
};

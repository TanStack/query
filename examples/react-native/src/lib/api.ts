import movies from '../data/movies.json';

export type Movie = {
  title: string;
  year: number;
};

export type MovieDetails = Movie & {
  info: {
    plot: string;
    actors: string[];
  };
};

function delay(t: number, v: () => void) {
  return new Promise(function (resolve) {
    setTimeout(resolve.bind(null, v), t);
  });
}

export function fetchMovies(): Promise<Movie[]> {
  console.log('fetchMovies');
  return delay(200 + Math.floor(Math.random() * 2000), () =>
    movies
      .slice(0, 100)
      .map((movie) => ({ title: movie.title, year: movie.year }))
  ) as Promise<Movie[]>;
}

export function fetchMovie(title: string): Promise<MovieDetails> {
  console.log('fetchMovie', title);
  return delay(200 + Math.floor(Math.random() * 2000), () => {
    const result = movies.filter((item) => item.title === title);
    if (result.length == 0) {
      throw new Error('Movie not found');
    }
    return result[0];
  }) as Promise<MovieDetails>;
}

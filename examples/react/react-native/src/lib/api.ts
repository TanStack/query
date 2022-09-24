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

function delay(t: number) {
  return new Promise(function (resolve) {
    setTimeout(resolve, t);
  });
}

export async function fetchMovies() {
  console.log('fetchMovies');

  await delay(200 + Math.floor(Math.random() * 2000));

  return movies
    .slice(0, 100)
    .map((movie) => ({ title: movie.title, year: movie.year })) as Promise<
    Movie[]
  >;
}

export async function fetchMovie(title: string) {
  console.log('fetchMovie', title);

  await delay(200 + Math.floor(Math.random() * 2000));

  const result = movies.filter((item) => item.title === title);

  if (result.length == 0) {
    throw new Error('Movie not found');
  }
  return result[0] as Promise<MovieDetails>;
}

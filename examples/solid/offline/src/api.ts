import { setupWorker, rest } from "msw";
import ky from "ky";

export type Movie = {
  id: string,
  title: string,
  comment: string,
}

const movies: Movie[] = [
  {
    id: "1",
    title: "Guardians of the Galaxy",
    comment: "",
  },
  {
    id: "2",
    title: "Wall-E",
    comment: "",
  },
];

export const fetchMovie = (id: string) => (
  ky.get(`/movies/${id}`).json() as Promise<{ movie: Movie, ts: number }>
);

export const fetchMovies = () => (
  ky.get("/movies").json() as Promise<{ movies: Array<Movie>, ts: number }>
);

export const updateMovie = (id: string, comment: string) => (
  ky.post(`/movies/${id}`, { json: { comment } }).json()
  // as Promise<TODO>
  // should return void (command query separation)
);

export const worker = setupWorker(
  ...[
    rest.get("/movies", (req, res, ctx) => {
      return res(
        ctx.delay(1000),
        ctx.json({
          ts: Date.now(),
          movies: movies.map(({ id, title }) => ({ id, title })),
        })
      );
    }),
    rest.get("/movies/:id", (req, res, ctx) => {
      const { id } = req.params;

      const movie = movies.find((movie) => movie.id === id);
      if (!movie) {
        return res(ctx.status(404, `Movie with id ${id} not found`));
      }

      return res(
        ctx.delay(1000),
        ctx.json({
          ts: Date.now(),
          movie,
        })
      );
    }),
    rest.post("/movies/:id", (req, res, ctx) => {
      const { id } = req.params;
      const { comment } = req.body as { comment: string };

      movies.forEach((movie) => {
        if (movie.id === id) {
          movie.comment = comment.toUpperCase();
        }
      });

      return res(
        ctx.delay(1000),
        ctx.json({
          message: `Successfully updated movie ${id}`,
        })
      );
    }),
  ]
);

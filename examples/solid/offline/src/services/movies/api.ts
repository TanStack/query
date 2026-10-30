export const moviesAPI = {
  getMovies: async (): Promise<{
    ts: number
    movies: Array<{ id: string; title: string }>
  }> => {
    const response = await fetch('/movies')
    if (!response.ok) {
      throw new Error(await response.text())
    }
    return await response.json()
  },
  getMovie: async (
    id: string,
  ): Promise<{
    ts: number
    movie: { comment: string; id: string; title: string }
  }> => {
    const response = await fetch(`/movies/${id}`)
    if (!response.ok) {
      throw new Error(await response.text())
    }
    return await response.json()
  },
  updateMovie: async (
    id: string,
    comment: string,
  ): Promise<{ message: string }> => {
    const response = await fetch(`/movies/${id}`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
      headers: { 'Content-Type': 'application/json' },
    })
    if (!response.ok) {
      throw new Error(await response.text())
    }
    return await response.json()
  },
}

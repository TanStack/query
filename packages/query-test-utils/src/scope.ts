/**
 * Creates a serial scope for the canonical and integrated v6 runtimes.
 * @param id - The shared queue ID.
 * @returns The scope option used by the v6 mutation cache.
 */
export function serialScope(id: string): { id: string } {
  return { id }
}

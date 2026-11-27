// Vite resolves #screen to one of these modules for each browser build.
export declare const ReadingList:
  | typeof import('./query.tsx').ReadingList
  | typeof import('./paginated.tsx').ReadingList
  | typeof import('./polling.tsx').ReadingList
  | typeof import('./options.tsx').ReadingList

// Re-exports the built-in TypeScript `NoInfer` (available since TS 5.4) under
// a distinct alias so the public `NoInfer` re-export from `./types` can
// delegate to it without recursing into itself.
export type IntrinsicNoInfer<T> = NoInfer<T>

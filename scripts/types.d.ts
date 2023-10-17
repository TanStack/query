import type { RollupOptions } from 'rollup'

export type Commit = {
  commit: CommitOrTree
  tree: CommitOrTree
  author: AuthorOrCommitter
  committer: AuthorOrCommitter
  subject: string
  body: string
  parsed: Parsed
}

export type CommitOrTree = {
  long: string
  short: string
}

export type AuthorOrCommitter = {
  name: string
  email: string
  date: string
}

export type Parsed = {
  type: string | null
  scope?: string | null
  subject: string
  merge?: null
  header: string
  body?: null
  footer?: null
  notes?: Array<null> | null
  references?: Array<null> | null
  mentions?: Array<null> | null
  revert?: null
  raw: string
}

export type Package = {
  name: string
  packageDir: string
  entries: Array<'main' | 'module' | 'svelte' | 'types'>
}

export type BranchConfig = {
  prerelease: boolean
}

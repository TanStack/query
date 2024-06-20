export type Package = {
  name: string
  packageDir: string
}

export type BranchConfig = {
  prerelease: boolean
  previousVersion?: boolean
}

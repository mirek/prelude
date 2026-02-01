export type Semver = {
  major: number,
  minor: number,
  patch: number,
  prerelease?: string,
  build?: string,
  date?: string
}

export type t = Semver

import * as Cmp from '@prelude/cmp'

const cmp =
  Cmp.object({
    major: Cmp.number,
    minor: Cmp.number,
    patch: Cmp.number,
    prerelease: Cmp.undefinedOr(Cmp.string),
    build: Cmp.undefinedOr(Cmp.string),
    date: Cmp.undefinedOr(Cmp.string)
  })

export default cmp

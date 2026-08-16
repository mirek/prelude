# Semver module

# Usage

```bash
npm i -E @prelude/semver
```

```ts
import * as Semver from '@prelude/semver'

const versions = [ '1.0.0', '1.0.0-beta.2', '1.0.0-beta.11' ]
versions.sort(Semver.stringCmp)
```

## Precedence

`cmp` compares parsed values and `stringCmp` compares version strings according to SemVer 2.0.0 precedence:

1. major, minor, and patch are compared numerically;
2. a prerelease has lower precedence than the corresponding stable release;
3. prerelease identifiers are compared from left to right;
4. numeric identifiers compare numerically and have lower precedence than alphanumeric identifiers;
5. when all shared identifiers are equal, the shorter prerelease has lower precedence;
6. build metadata and the optional parse date do not affect precedence.

`dsc` and `stringDsc` apply the exact reverse ordering. Parsing still preserves prerelease, build metadata, and date fields even when they do not affect comparison.

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).

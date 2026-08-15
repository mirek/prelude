[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=preludejs_semver&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=preludejs_semver)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=preludejs_semver&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=preludejs_semver)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=preludejs_semver&metric=bugs)](https://sonarcloud.io/summary/new_code?id=preludejs_semver)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=preludejs_semver&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=preludejs_semver)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=preludejs_semver&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=preludejs_semver)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=preludejs_semver&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=preludejs_semver)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=preludejs_semver&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=preludejs_semver)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=preludejs_semver&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=preludejs_semver)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=preludejs_semver&metric=coverage)](https://sonarcloud.io/summary/new_code?id=preludejs_semver)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=preludejs_semver&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=preludejs_semver)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=preludejs_semver&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=preludejs_semver)

---

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

```
MIT License

Copyright 2021 Mirek Rusin

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

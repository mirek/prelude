import re from './re.js'

const parse =
  (semver: string, date?: string) => {
    const match = re.exec(semver)
    if (!match) {
      throw new Error(`invalid semver ${semver}`)
    }
    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      prerelease: match[4] || undefined,
      build: match[5] || undefined,
      date
    }
  }

export default parse

import re from './re.js'

const predicate =
  (value: string) =>
    re.test(value)

export default predicate

const regexp =
  (re: RegExp) =>
    (value: unknown): value is string => {
      if (typeof value !== 'string') {
        return false
      }
      // A sticky (or global) regexp keeps lastIndex between calls; the predicate must be stateless.
      re.lastIndex = 0
      return re.test(value)
    }

export default regexp

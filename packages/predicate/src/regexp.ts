const regexp =
  (re: RegExp) =>
    (value: unknown): value is string => {
      if (typeof value !== 'string') {
        return false
      }
      // A sticky (or global) regexp keeps lastIndex between calls; the predicate must be stateless.
      // Only those flags make test() write lastIndex, so leave other (possibly frozen) regexps untouched.
      if (re.global || re.sticky) {
        re.lastIndex = 0
      }
      return re.test(value)
    }

export default regexp

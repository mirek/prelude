/** @returns a map-like object of grouped values. */
export const groupObject =
  <T, K extends number | string | symbol>(keyOfValue: (value: T) => K) =>
    (values: Iterable<T>) => {
      const record = {} as Record<K, undefined | (T[])>
      for (const value of values) {
        const key = keyOfValue(value)
        // Keys such as 'constructor' resolve to Object.prototype members on a plain object; only own entries count.
        const recordValues = Object.hasOwn(record, key) ? record[key] : undefined
        if (recordValues) {
          recordValues.push(value)
        } else {
          record[key] = [ value ]
        }
      }
      return record
    }

export default groupObject

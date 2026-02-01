export const undefinedIfEmpty =
  <T>(values: T[]) =>
    values.length === 0 ? undefined : values

export const maybeUndefinedIfEmpty =
  <T>(condition: boolean, values: T[]) =>
    condition ?
      undefinedIfEmpty(values) :
      values

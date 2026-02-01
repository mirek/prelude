/** @returns prefixed string if prefix has been provided, input string otherwise. */
export const maybeWithPrefix =
  (value: string, prefix?: null | string) =>
    prefix == null ?
      value :
      `${prefix}${value}`

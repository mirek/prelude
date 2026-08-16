import type { Name } from './ast.js'
import * as S from './string.js'

export type t =
  Name

/** Builds a name; unprefixed and without a namespace by default. */
export const of =
  (local: string, prefix = '', namespace?: string): Name =>
    ({ prefix, local, namespace })

/** Same prefix and local part: the literal name as written. */
export const eq =
  (a: t, b: t): boolean =>
    a.prefix === b.prefix && a.local === b.local

/** Same expanded name: namespace and local part, whatever the prefix. */
export const same =
  (a: t, b: t): boolean =>
    a.namespace === b.namespace && a.local === b.local

/** `prefix:local` (or `local`), optionally prefixed with `prefix`; `format: 'local'` drops the namespace prefix. */
export const string =
  (name: t, { prefix, format = 'qualified' }: {
    prefix?: null | string,
    format?: 'local' | 'qualified'
  } = {}): string =>
    S.maybeWithPrefix(format === 'local' || name.prefix === '' ? name.local : `${name.prefix}:${name.local}`, prefix)

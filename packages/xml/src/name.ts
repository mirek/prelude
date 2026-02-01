import type { Name } from './ast.js'
import * as S from './string.js'

export type t =
  Name

/** @todo support string as qname? */
export const eq =
  (a: t, b: t) => {
    if (typeof a === 'string' && typeof b === 'string') {
      return a === b
    }
    if (typeof a !== 'string' && typeof b !== 'string') {
      return a.namespace === b.namespace && a.name === b.name
    }
    return false
  }

export const string =
  (node: t, { prefix, format = 'qualified' }: {
    prefix?: null | string,
    format?: 'local' | 'qualified'
  } = {}) => {
    if (typeof node === 'string') {
      return S.maybeWithPrefix(node, prefix)
    }
    if (format === 'local') {
      return S.maybeWithPrefix(node.name, prefix)
    }
    return S.maybeWithPrefix(`${node.namespace}:${node.name}`)
  }

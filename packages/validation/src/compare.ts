import { ok, fail, type Validator } from './prelude.js'

const compare =
  (operator: 'gt' | 'gte' | 'lt' | 'lte', test: (value: number, than: number) => boolean) =>
    (than: number): Validator<number> =>
      value =>
        typeof value === 'number' && test(value, than) ?
          ok(value) :
          fail(value, { kind: 'compare', operator, than })

export const gt = compare('gt', (value, than) => value > than)
export const gte = compare('gte', (value, than) => value >= than)
export const lt = compare('lt', (value, than) => value < than)
export const lte = compare('lte', (value, than) => value <= than)

export const between =
  (min: number, max: number): Validator<number> =>
    value =>
      typeof value === 'number' && value >= min && value <= max ?
        ok(value) :
        fail(value, { kind: 'between', min, max })

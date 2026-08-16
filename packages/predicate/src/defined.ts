import * as V from '@prelude/validation'

const defined = <T>(value: T): value is Exclude<T, undefined> => V.defined(value).ok

export default defined

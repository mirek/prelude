import * as $ from '@prelude/refute'
import * as Encoder from '../encoder.js'

export type t = Error

export const constructor = Error

export const name = 'Error'

export const encode =
  (value: t, encoder: Encoder.t) => {
    const { name: name_, message, cause, stack } = value
    if (value instanceof AggregateError) {
      const { errors } = value
      return {
        ['^Error$']: {
          name: name_,
          message,
          errors: errors.map(error => Encoder.encode(error, encoder)),
          cause,
          stack
        }
      }
    }
    return {
      ['^Error$']: {
        name: name_,
        message,
        cause,
        stack
      }
    }
  }

export const decode =
  (value: unknown): t => {
    const refute = $.object({
      name: $.string,
      message: $.string,
      cause: $.unknown,
      errors: $.undefinedOr($.array($.unknown)),
      stack: $.undefinedOr($.string)
    })(value)
    if ($.failed(refute)) {
      throw new Error($.reasonWithoutReceived(refute))
    }
    const { name: name_, message, cause, errors, stack } = refute.value
    const options = cause === undefined ? undefined : { cause }
    const withStack = (err: Error) => stack === undefined ? err : Object.assign(err, { stack })
    switch (name_) {
      case 'AggregateError':
        return withStack(new AggregateError(errors ?? [], message, options))
      case 'EvalError':
        return withStack(new EvalError(message, options))
      case 'RangeError':
        return withStack(new RangeError(message, options))
      case 'ReferenceError':
        return withStack(new ReferenceError(message, options))
      case 'SyntaxError':
        return withStack(new SyntaxError(message, options))
      case 'TypeError':
        return withStack(new TypeError(message, options))
      case 'URIError':
        return withStack(new URIError(message, options))
      default: {
        const err = new Error(message, options)
        if (name_ !== 'Error') {
          Object.assign(err, { name: name_ })
        }
        if (errors !== undefined) {
          Object.assign(err, { errors })
        }
        return withStack(err)
      }
    }
  }

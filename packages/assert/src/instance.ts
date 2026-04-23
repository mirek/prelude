import { AssertionError, type Assert, type Constructor } from './prelude.js'

/** Asserts `value` is an instance of `class_`. */
const instance =
  <T extends Constructor>(class_: T): Assert<InstanceType<T>> => {
    const expected = `an instance of ${class_.name}`
    return value => {
      if (value instanceof class_) {
        return value as InstanceType<T>
      }
      throw new AssertionError({ expected, received: value })
    }
  }

export default instance

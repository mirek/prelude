import pipe from './pipe.js'
import pipe0 from './pipe0.js'

export type IntersectionOfUnion<T> =
  (T extends unknown ? (_: T) => unknown : never) extends (_: infer R) => unknown ?
    R :
    never

export {
  pipe,
  pipe0
}

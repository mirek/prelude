import * as V from '@prelude/validation'
import { asserting, type Assert, type Constructor } from './prelude.js'

const instance = <T extends Constructor>(class_: T): Assert<InstanceType<T>> => asserting(V.instance(class_))

export default instance

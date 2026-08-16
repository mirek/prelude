import * as V from '@prelude/validation'
import { refuting, type Refute, type Constructor } from './prelude.js'

const instance = <T extends Constructor>(class_: T): Refute<InstanceType<T>> => refuting(V.instance(class_))

export default instance

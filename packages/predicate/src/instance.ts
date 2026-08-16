import * as V from '@prelude/validation'
import { predicating } from './core.js'
import type Predicate from './predicate.js'

const instance = <T extends new (...args: unknown[]) => unknown>(class_: T): Predicate<InstanceType<T>> => predicating(V.instance(class_))

export default instance

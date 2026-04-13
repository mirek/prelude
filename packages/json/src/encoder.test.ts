import * as Json from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const custom = Json.of({
  ...Json.global,
  legacyDecoder: true
})
Json.register(custom, Json.Codecs.Undefined)
Json.register(custom, Json.Codecs.Number)

await test('bigint', () => {
  assert.equal(Json.stringify(1n), '{"^bigint$":"1"}')
})

await test('Date', () => {
  assert.equal(Json.stringify(new Date('2020-01-01T00:00:00.000Z')), '{"^Date$":"2020-01-01T00:00:00.000Z"}')
})

await test('Error', () => {
  assert.equal(Json.stringify(Object.assign(new Error('foo'), { stack: 'test' })), '{"^Error$":{"name":"Error","message":"foo","stack":"test"}}')
})

await test('Map', () => {
  assert.equal(Json.stringify(new Map([ [ 'foo', 'bar' ], [ 'baz', 'qux' ] ])), '{"^Map$":{"foo":"bar","baz":"qux"}}')
})

await test('number', () => {
  assert.equal(Json.stringify(4.2), '4.2')
  assert.equal(custom.stringify(NaN), '{"^Number$":"NaN"}')
  assert.equal(custom.stringify(Infinity), '{"^Number$":"Infinity"}')
  assert.equal(custom.stringify(-Infinity), '{"^Number$":"-Infinity"}')
  assert.equal(custom.stringify(-0), '{"^Number$":"-0"}')
})

await test('nested', () => {
  assert.equal(Json.stringify(new Map([ [ 'foo', new Set([ 1, 2, 3 ]) ] ])), '{"^Map$":{"foo":{"^Set$":[1,2,3]}}}')
})

await test('Undefined', () => {
  assert.equal(custom.stringify(undefined), '{"^Undefined$":true}')
  assert.equal(custom.stringify({ foo: undefined }), '{"foo":{"^Undefined$":true}}')
  assert.equal(custom.stringify([ null, undefined, NaN ]), '[null,{"^Undefined$":true},{"^Number$":"NaN"}]')
})

await test('weirdos', () => {
  assert.equal(custom.stringify([
    undefined,
    null,
    NaN,
    Infinity,
    -Infinity,
    -0,
    0
  ]), '[{"^Undefined$":true},null,{"^Number$":"NaN"},{"^Number$":"Infinity"},{"^Number$":"-Infinity"},{"^Number$":"-0"},0]')
})

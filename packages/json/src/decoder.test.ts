import * as Json from './index.js'
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

await describe('custom coder with Undefined, Number and legacy decoder', async () => {

  const custom = Json.of({
    ...Json.global,
    legacyDecoder: true
  })
  Json.register(custom, Json.Codecs.Undefined)
  Json.register(custom, Json.Codecs.Number)

  await test('^Undefined$', () => {

    assert.equal(custom.parse(JSON.stringify({
      '^Undefined$': true
    })), undefined)

    assert.deepEqual(custom.parse(JSON.stringify({
      'foo^Undefined$': true
    })), {
      foo: undefined
    })

  })

  await test('Number', () => {

    assert.ok(Number.isNaN(custom.parse(JSON.stringify({
      '^Number$': 'NaN'
    }))))

    assert.deepEqual(custom.parse(JSON.stringify({
      'foo^Number$': 'NaN'
    })), {
      foo: NaN
    })

    assert.equal(custom.parse(JSON.stringify({
      '^Number$': 'Infinity'
    })), Infinity)

    assert.deepEqual(custom.parse(JSON.stringify({
      'foo^Number$': 'Infinity'
    })), {
      foo: Infinity
    })

    assert.equal(custom.parse(JSON.stringify({
      '^Number$': '-Infinity'
    })), -Infinity)

    assert.deepEqual(custom.parse(JSON.stringify({
      'foo^Number$': '-Infinity'
    })), {
      foo: -Infinity
    })

    assert.equal(custom.parse(JSON.stringify({
      '^Number$': '-0'
    })), -0)

    assert.deepEqual(custom.parse(JSON.stringify({
      'foo^Number$': '-0'
    })), {
      foo: -0
    })

  })

  await test('Json (legacy)', () => {
    assert.deepEqual(custom.parse(JSON.stringify({
      'Json': JSON.stringify({ bar: 'baz' })
    })), {
      bar: 'baz'
    })
    assert.deepEqual(custom.parse(JSON.stringify({
      'fooJson': JSON.stringify({ bar: 'baz' })
    })), {
      foo: { bar: 'baz' }
    })
  })

})


await test('^Json$', () => {

  assert.deepEqual(Json.parse(JSON.stringify({
    '^Json$': JSON.stringify({ bar: 'baz' })
  })), {
    bar: 'baz'
  })

  assert.deepEqual(Json.parse(JSON.stringify({
    'foo^Json$': JSON.stringify({ bar: 'baz' })
  })), {
    foo: { bar: 'baz' }
  })

})

await test('^RegExp$', () => {

  assert.deepEqual(Json.parse(JSON.stringify({
    '^RegExp$': { source: 'foo', flags: 'g' }
  })), /foo/g)

  assert.deepEqual(Json.parse(JSON.stringify({
    're^RegExp$': { source: 'foo', flags: 'g' }
  })), {
    re: /foo/g
  })

  assert.deepEqual(Json.parse(JSON.stringify([
    { '^RegExp$': { source: 'foo', flags: 'g' } },
    { '^RegExp$': { source: 'bar', flags: 'i' } }
  ])), [
    /foo/g,
    /bar/i
  ])

})

await test('^Set$', () => {

  assert.deepEqual(Json.parse(JSON.stringify({
    '^Set$': [ 1, 2, 3 ]
  })), new Set([ 1, 2, 3 ]))

  assert.deepEqual(Json.parse(JSON.stringify({
    'set^Set$': [ 1, 2, 3 ]
  })), {
    set: new Set([ 1, 2, 3 ])
  })

})

await test('^Map$', () => {

  assert.deepEqual(Json.parse(JSON.stringify({
    '^Map$': { foo: 'bar', baz: 'qux' }
  })), new Map([ [ 'foo', 'bar' ], [ 'baz', 'qux' ] ]))

  assert.deepEqual(Json.parse(JSON.stringify({
    'map^Map$': { foo: 'bar', baz: 'qux' }
  })), {
    map: new Map([ [ 'foo', 'bar' ], [ 'baz', 'qux' ] ])
  })

})

await test('nested', () => {
  assert.deepEqual(Json.parse('{"foo^Set$":[1,2,3]}'), { foo: new Set([ 1, 2, 3 ]) })
  assert.deepEqual(Json.parse('{"^Map$":{"foo^Set$":[1,2,3]}}'), new Map([ [ 'foo', new Set([ 1, 2, 3 ]) ] ]))
  assert.deepEqual(Json.parse('{"foo":{"^Set$":[1,2,3]}}'), { foo: new Set([ 1, 2, 3 ]) })
  assert.deepEqual(Json.parse('{"^Map$":{"foo":{"^Set$":[1,2,3]}}}'), new Map([ [ 'foo', new Set([ 1, 2, 3 ]) ] ]))
})

await test('null is allowed', () => {
  const names = Json.global.decoders.keys()
  for (const name of names) {
    assert.equal(Json.parse(JSON.stringify({ [`^${name}$`]: null })), null)
  }
})

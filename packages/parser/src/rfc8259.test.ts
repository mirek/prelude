import parse from './rfc8259/parse.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('basic', () => {
  assert.deepEqual(parse(`
    {
      "Image": {
        "Width":  800,
        "Height": 600,
        "Title":  "View from 15th Floor",
        "Thumbnail": {
          "Url":    "http://www.example.com/image/481989943",
          "Height": 125,
          "Width":  100
        },
        "Animated" : false,
        "IDs": [116, 943, 234, 38793]
      }
    }
  `), {
    'Image': {
      'Width': 800,
      'Height': 600,
      'Title': 'View from 15th Floor',
      'Thumbnail': {
        'Url': 'http://www.example.com/image/481989943',
        'Height': 125,
        'Width': 100
      },
      'Animated': false,
      'IDs': [ 116, 943, 234, 38793 ]
    }
  })
})

await test('escape sequences decode to control characters', () => {
  assert.equal(parse('"a\\nb"'), 'a\nb')
  assert.equal(parse('"\\t\\b\\f\\r"'), '\t\b\f\r')
  assert.equal(parse('"\\"\\\\\\/"'), '"\\/')
  assert.equal(parse('"\\u0041\\u00e9"'), 'Aé')
  const source = JSON.stringify({ text: 'line1\nline2\t"quoted"\\ /', list: [ '\b\f\r' ] })
  assert.deepEqual(parse(source), JSON.parse(source))
})

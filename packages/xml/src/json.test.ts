import * as Xml from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('inline attribute prefix applies to namespaced attributes too', () => {
  const root = Xml.parse('<r a="1" ns:b="2"/>').root
  assert.deepEqual(Xml.json(root, { inlineAttributePrefix: '@' }), {
    type: 'r',
    '@a': '1',
    '@ns:b': '2',
    text: undefined,
    elements: []
  })
  assert.deepEqual(Xml.Json.attributes(root, { prefix: '$', qualified: false }), { $a: '1', $b: '2' })
  assert.deepEqual(Xml.json(root).attributes, { a: '1', 'ns:b': '2' })
})

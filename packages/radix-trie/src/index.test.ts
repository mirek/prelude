import * as RadixTrie from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('insert', () => {
  const trie = RadixTrie.empty()
  RadixTrie.insert(trie, 'foo')
  assert.deepEqual(trie, {
    f: { P: 'foo', E: true }
  })
  RadixTrie.insert(trie, 'foobar')
  assert.deepEqual(trie, {
    f: { P: 'foo', E: true, N: {
      b: { P: 'bar', E: true }
    } }
  })
  RadixTrie.insert(trie, 'foobaz')
  assert.deepEqual(trie, {
    f: { P: 'foo', E: true, N: {
      b: { P: 'ba', E: false, N: {
        r: { P: 'r', E: true },
        z: { P: 'z', E: true }
      } }
    } }
  })
})

await test('simple', () => {
  const trie = RadixTrie.of([
    'foo',
    'boo',
    'foz',
    'fzz'
  ])
  assert.deepEqual(trie, {
    f: {
      P: 'f',
      E: false,
      N: {
        o: {
          P: 'o',
          N: { o: { P: 'o', E: true }, z: { P: 'z', E: true } },
          E: false
        },
        z: { P: 'zz', E: true }
      }
    },
    b: { P: 'boo', E: true }
  })
})

await test('longest prefix', () => {
  const trie = RadixTrie.of([
    'foo',
    'foobar',
    'foobaz'
  ])
  assert.deepEqual(RadixTrie.longestPrefix(trie, 'foobarbaz'), 'foobar')
  assert.deepEqual(RadixTrie.longestPrefix(trie, 'food'), 'foo')
})

await test('has', () => {
  const trie = RadixTrie.of([
    'foo',
    'foobar',
    'foobaz'
  ])
  assert.equal(RadixTrie.has(trie, 'foo'), true)
  assert.equal(RadixTrie.has(trie, 'foobar'), true)
  assert.equal(RadixTrie.has(trie, 'foobaz'), true)
  assert.equal(RadixTrie.has(trie, ''), false)
  assert.equal(RadixTrie.has(trie, 'x'), false)
  assert.equal(RadixTrie.has(trie, 'f'), false)
  assert.equal(RadixTrie.has(trie, 'fo'), false)
  assert.equal(RadixTrie.has(trie, 'foob'), false)
  assert.equal(RadixTrie.has(trie, 'fooba'), false)
  assert.equal(RadixTrie.has(trie, 'foobax'), false)
})

await test('empty strings', () => {
  const trie = RadixTrie.of([ '' ])
  assert.equal(RadixTrie.has(trie, ''), true)
})

await test('mixed empty and non-empty strings', () => {
  // Test handling of empty strings alongside non-empty strings
  const trie = RadixTrie.empty()

  // First insert empty string
  RadixTrie.insert(trie, '')
  assert.equal(RadixTrie.has(trie, ''), true)

  // Then insert non-empty strings
  RadixTrie.insert(trie, 'a')
  RadixTrie.insert(trie, 'ab')

  // All strings should be preserved in the trie
  assert.equal(RadixTrie.has(trie, ''), true)
  assert.equal(RadixTrie.has(trie, 'a'), true)
  assert.equal(RadixTrie.has(trie, 'ab'), true)

  // Create trie in reverse order
  const trie2 = RadixTrie.of([ 'ab', 'a', '' ])

  assert.equal(RadixTrie.has(trie2, ''), true)
  assert.equal(RadixTrie.has(trie2, 'a'), true)
  assert.equal(RadixTrie.has(trie2, 'ab'), true)
})

await test('preserve prefix as valid word when splitting', () => {

  // Test that when a node is split, if the prefix itself was a valid word (e=true),
  // that information is preserved after the split
  const trie = RadixTrie.empty()

  // First insert "test" into the trie
  RadixTrie.insert(trie, 'test')
  assert.equal(RadixTrie.has(trie, 'test'), true)

  // Then insert "testing" which shares the prefix "test"
  // This should cause a split at the node containing "test"
  RadixTrie.insert(trie, 'testing')

  // After the split, "test" should still be a valid word in the trie
  assert.equal(RadixTrie.has(trie, 'test'), true)
  assert.equal(RadixTrie.has(trie, 'testing'), true)
})

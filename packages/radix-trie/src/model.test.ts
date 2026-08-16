import * as RadixTrie from './index.js'
import * as Testing from '@prelude/testing'
import { test } from 'node:test'
import assert from 'node:assert/strict'

// Structural invariants of a compressed trie, checked independently of insert:
// - the empty-string edge exists only at the root and carries no children;
// - every other edge is keyed by the first unit of its non-empty prefix;
// - a child map is never empty;
// - an edge that is not a word end has at least two children (otherwise it
//   would not be compressed) — except at the root, where single edges are fine.
const assertWellFormed =
  (trie: RadixTrie.t, root = true): void => {
    for (const [ key, edge ] of Object.entries(trie)) {
      if (edge === undefined) {
        continue
      }
      if (key === '') {
        assert.ok(root, 'empty-string edge below the root')
        assert.equal(edge.P, '', 'empty-string edge with a prefix')
        assert.equal(edge.E, true, 'empty-string edge that is not a word end')
        assert.equal(edge.N, undefined, 'empty-string edge with children')
        continue
      }
      assert.ok(edge.P.length > 0, `edge ${JSON.stringify(key)} has an empty prefix`)
      assert.equal(edge.P[0], key, `edge ${JSON.stringify(key)} is keyed by ${JSON.stringify(edge.P[0])}`)
      if (edge.N !== undefined) {
        const children = Object.values(edge.N).filter(child => child !== undefined)
        assert.ok(children.length > 0, `edge ${JSON.stringify(edge.P)} has an empty child map`)
        assert.ok(edge.E || children.length >= 2, `non-terminal edge ${JSON.stringify(edge.P)} has a single child`)
        assertWellFormed(edge.N, false)
      } else {
        assert.ok(edge.E, `leaf edge ${JSON.stringify(edge.P)} is not a word end`)
      }
    }
  }

const words =
  (trie: RadixTrie.t, prefix = ''): string[] =>
    Object.values(trie).flatMap(edge => edge === undefined ?
      [] :
      [
        ...(edge.E ? [ prefix + edge.P ] : []),
        ...(edge.N ? words(edge.N, prefix + edge.P) : [])
      ])

type Op = { word: string, query: string, offset: number }

const alphabet = 'abc'

await test('has, prefixes and longest/first prefix agree with a set model and the trie stays well formed', async () => {
  await Testing.checkTrace<Op>({
    seed: 0x7a1e,
    trials: 200,
    length: rng => rng.between(1, 8),
    op: rng => ({
      word: rng.string(alphabet, 0, 4),
      query: rng.string(alphabet, 0, 6),
      offset: rng.int(3)
    }),
    simplify: op => [
      ...(op.word.length > 0 ? [ { ...op, word: op.word.slice(0, -1) } ] : []),
      ...(op.query.length > 0 ? [ { ...op, query: op.query.slice(1) } ] : []),
      ...(op.offset > 0 ? [ { ...op, offset: op.offset - 1 } ] : [])
    ],
    run: ops => {
      const trie = RadixTrie.empty()
      const model = new Set<string>()
      for (const op of ops) {
        RadixTrie.insert(trie, op.word)
        model.add(op.word)
        assertWellFormed(trie)
        assert.deepEqual(words(trie).sort(), [ ...model ].sort())

        const { query, offset } = op
        const rest = query.slice(offset)
        const expected = Array.from({ length: rest.length + 1 }, (_, i) => rest.slice(0, i))
          .filter(prefix => model.has(prefix))
        const lengths = offset <= query.length ? expected.map(prefix => prefix.length) : []
        assert.deepEqual([ ...RadixTrie.prefixLengths(trie, query, offset) ], lengths, `prefixLengths ${JSON.stringify(query)} @${offset}`)
        assert.deepEqual([ ...RadixTrie.prefixes(trie, query, offset) ], offset <= query.length ? expected : [], `prefixes ${JSON.stringify(query)} @${offset}`)
        assert.equal(RadixTrie.longestPrefixLength(trie, query, offset), lengths.length > 0 ? Math.max(...lengths) : 0)
        assert.equal(RadixTrie.firstPrefixLength(trie, query, offset), lengths[0] ?? 0)
        assert.equal(RadixTrie.longestPrefix(trie, query, offset), lengths.length > 0 && Math.max(...lengths) > 0 ? rest.slice(0, Math.max(...lengths)) : undefined)
        assert.equal(RadixTrie.firstPrefix(trie, query, offset), (lengths[0] ?? 0) > 0 ? rest.slice(0, lengths[0]) : undefined)
        for (const candidate of [ ...model, query, rest, op.word + 'a', op.word.slice(0, -1) ]) {
          assert.equal(RadixTrie.has(trie, candidate), model.has(candidate), `has ${JSON.stringify(candidate)}`)
        }
        assert.equal(RadixTrie.has(trie, query, offset), model.has(rest), `has ${JSON.stringify(query)} @${offset}`)
      }
    }
  })
})

await test('the trie is canonical: insertion order and repeats do not change its shape', async () => {
  await Testing.checkTrace<string[]>({
    seed: 0xca0,
    trials: 200,
    length: 1,
    op: rng => Array.from({ length: rng.between(1, 8) }, () => rng.string(alphabet, 0, 4)),
    run: cases => {
      for (const words of cases) {
        const rng = Testing.prng(words.join('|').length)
        const reference = RadixTrie.of(words)
        assertWellFormed(reference)
        assert.deepEqual(RadixTrie.of(rng.shuffled(words)), reference)
        assert.deepEqual(RadixTrie.of([ ...words, ...words ]), reference)
        assert.deepEqual(RadixTrie.of(new Set(words)), reference)
      }
    }
  })
})

await test('the well-formedness checker rejects uncompressed and mis-keyed tries', () => {
  assert.throws(() => assertWellFormed({ a: { P: 'a', E: false, N: { b: { P: 'b', E: true } } } }), /single child/)
  assert.throws(() => assertWellFormed({ a: { P: 'ba', E: true } }), /keyed by/)
  assert.throws(() => assertWellFormed({ a: { P: 'a', E: false } }), /not a word end/)
  assert.throws(() => assertWellFormed({ a: { P: 'a', E: true, N: {} } }), /empty child map/)
  assertWellFormed(RadixTrie.of([ '', 'a', 'ab', 'ac', 'b' ]))
})

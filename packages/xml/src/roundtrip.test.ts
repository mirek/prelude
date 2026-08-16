import * as Xml from './index.js'
import * as Testing from '@prelude/testing'
import { test } from 'node:test'
import assert from 'node:assert/strict'

// Property test: random documents are generated as ASTs, serialized with the
// escaping XML requires, parsed back and compared with the original AST. This
// exercises names, attributes, references, comments, CDATA, processing
// instructions, namespaces and mixed content together; a failure reports the
// seed and a shrunk document.

const escapeText = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/]]>/g, ']]&gt;')
const escapeAttribute = (value: string) => value
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
  .replace(/\n/g, '&#10;').replace(/\t/g, '&#9;').replace(/\r/g, '&#13;')

const serializeName = (name: Xml.Ast.Name) => Xml.Name.string(name)

const serialize =
  (element: Xml.Ast.Element): string => {
    const attributes = element.attributes.map(attribute => ` ${serializeName(attribute.name)}="${escapeAttribute(attribute.value)}"`).join('')
    if (element.items.length === 0) {
      return `<${serializeName(element.name)}${attributes}/>`
    }
    const items = element.items.map(item => {
      switch (item.type) {
        case 'Text': return escapeText(item.value)
        case 'Cdata': return `<![CDATA[${item.value}]]>`
        case 'Comment': return `<!--${item.value}-->`
        case 'ProcessingInstruction': return item.value === '' ? `<?${item.target}?>` : `<?${item.target} ${item.value}?>`
        case 'Element': return serialize(item)
      }
    }).join('')
    return `<${serializeName(element.name)}${attributes}>${items}</${serializeName(element.name)}>`
  }

const bindings = { p: 'urn:p', q: 'urn:q' }
const textAlphabet = 'ab <>&"\'\n\t]€😀'
const commentAlphabet = 'ab -<>&'
const nameAlphabet = 'abé日'

const name =
  (rng: Testing.Prng, kind: 'element' | 'attribute'): Xml.Ast.Name => {
    const local = rng.string(nameAlphabet, 1, 3)
    if (rng.bool(0.3)) {
      const prefix = rng.pick([ 'p', 'q' ] as const)
      return Xml.Name.of(local, prefix, bindings[prefix])
    }
    return Xml.Name.of(local, '', kind === 'element' ? 'urn:default' : undefined)
  }

const attributes =
  (rng: Testing.Prng): Xml.Ast.Attribute[] => {
    const result: Xml.Ast.Attribute[] = []
    const seen = new Set<string>()
    for (let i = rng.int(3); i > 0; i--) {
      const attributeName = name(rng, 'attribute')
      const key = `${attributeName.namespace ?? ''}|${attributeName.local}|${attributeName.prefix}`
      if (seen.has(key) || [ ...seen ].some(other => other.startsWith(`${attributeName.namespace ?? ''}|${attributeName.local}|`) && attributeName.namespace !== undefined)) {
        continue
      }
      seen.add(key)
      result.push({ type: 'Attribute', name: attributeName, value: rng.string(textAlphabet, 0, 6) })
    }
    return result
  }

const element =
  (rng: Testing.Prng, depth: number): Xml.Ast.Element => {
    const items: Xml.Ast.Item[] = []
    let lastText = false
    for (let i = rng.int(depth > 0 ? 5 : 3); i > 0; i--) {
      const roll = rng.float()
      if (roll < 0.35 && !lastText) {
        // Adjacent text merges into one node, so never generate two in a row (and never an empty one).
        items.push({ type: 'Text', value: rng.string(textAlphabet, 1, 8) })
        lastText = true
        continue
      }
      lastText = false
      if (roll < 0.5) {
        items.push({ type: 'Cdata', value: rng.string(textAlphabet, 0, 6).replace(/]]>/g, ']]') })
      } else if (roll < 0.6) {
        // No "--" inside a comment, and it cannot end with "-" (that would make "--->").
        items.push({ type: 'Comment', value: rng.string(commentAlphabet, 0, 6).replace(/-+/g, '-').replace(/-$/, '') })
      } else if (roll < 0.7) {
        // Leading white space separates the target from the data and is not part of it.
        items.push({ type: 'ProcessingInstruction', target: rng.pick([ 'pi', 'x' ]), value: rng.string(commentAlphabet, 0, 6).replace(/\?>/g, '?').replace(/^ +/, '') })
      } else if (depth > 0) {
        items.push(element(rng, depth - 1))
      }
    }
    return { type: 'Element', name: name(rng, 'element'), attributes: attributes(rng), items }
  }

const declarations: Xml.Ast.Attribute[] = [
  { type: 'Attribute', name: Xml.Name.of('xmlns', '', 'http://www.w3.org/2000/xmlns/'), value: 'urn:default' },
  { type: 'Attribute', name: Xml.Name.of('p', 'xmlns', 'http://www.w3.org/2000/xmlns/'), value: 'urn:p' },
  { type: 'Attribute', name: Xml.Name.of('q', 'xmlns', 'http://www.w3.org/2000/xmlns/'), value: 'urn:q' }
]

await test('generated documents round-trip through serialize and parse', async () => {
  await Testing.checkTrace<Xml.Ast.Element>({
    seed: 0x3a71,
    trials: 300,
    length: 1,
    op: rng => element(rng, 3),
    simplify: root => [
      ...root.items.map((_, i) => ({ ...root, items: [ ...root.items.slice(0, i), ...root.items.slice(i + 1) ] })),
      ...(root.attributes.length > 0 ? [ { ...root, attributes: root.attributes.slice(1) } ] : [])
    ],
    run: roots => {
      for (const generated of roots) {
        const root = { ...generated, attributes: [ ...declarations, ...generated.attributes ] }
        const source = `<?xml version="1.0"?>\n<!-- generated -->\n${serialize(root)}\n`
        const document = Xml.parse(source)
        assert.deepEqual(document.root, root, source)
        assert.deepEqual(document.prelude, [ { type: 'Comment', value: ' generated ' } ])
        // Serializing the parsed tree gives the same text: the AST loses nothing that matters.
        assert.equal(serialize(document.root), serialize(root))
      }
    }
  })
})

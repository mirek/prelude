import type * as Ast from './ast.js'
import { isChar, isNameChar, isNameStart, isSpace, predefinedEntities, xmlNamespace, xmlnsNamespace } from './chars.js'
import XmlError from './error.js'

/**
 * Parses an XML 1.0 document into an {@link Ast.Document}.
 *
 * Supported: the XML declaration, comments, processing instructions, a
 * document type declaration with public/system identifiers and an internal
 * subset (kept verbatim, not interpreted), elements, attributes, character
 * data, CDATA sections, the five predefined entities, decimal and hexadecimal
 * character references, Unicode names, and Namespaces in XML 1.0 (prefixes are
 * resolved, `xmlns` declarations are scoped, `xml`/`xmlns` are reserved).
 *
 * Not supported by design: DTD processing (declared entities, attribute
 * defaults, validation) and any external resource — a reference to an entity
 * other than the predefined five is an error, so no expansion or fetching can
 * happen. Line ends (`\r\n`, `\r`) are normalized to `\n` first, as XML
 * requires; positions in errors refer to the normalized text.
 *
 * @throws {XmlError} on the first well-formedness or namespace error, with
 *   its offset, line and column.
 */
export const parse =
  (input: string): Ast.Document =>
    new Parser(input.replace(/\r\n?/g, '\n')).document()

export default parse

type Frame = {
  element: Ast.Element,
  /** Raw `prefix:local` of the start tag, for end-tag matching. */
  qualified: string,
  /** Namespace bindings in scope; `''` is the default namespace. */
  bindings: ReadonlyMap<string, string>
}

const rootBindings: ReadonlyMap<string, string> = new Map([ [ 'xml', xmlNamespace ] ])

const codeLabel =
  (code: number) =>
    `U+${code.toString(16).toUpperCase().padStart(4, '0')}`

class Parser {
  #input: string
  #pos = 0

  constructor(input: string) {
    this.#input = input
  }

  // -- errors -------------------------------------------------------------

  #fail(message: string, offset = this.#pos): never {
    let line = 1
    let lineStart = 0
    for (let i = 0; i < offset && i < this.#input.length; i++) {
      if (this.#input.charCodeAt(i) === 0xa) {
        line++
        lineStart = i + 1
      }
    }
    throw new XmlError(message, offset, line, offset - lineStart + 1)
  }

  // -- low level ----------------------------------------------------------

  #eof(): boolean {
    return this.#pos >= this.#input.length
  }

  #peekCode(): number {
    return this.#input.codePointAt(this.#pos) ?? -1
  }

  #startsWith(literal: string): boolean {
    return this.#input.startsWith(literal, this.#pos)
  }

  #expect(literal: string, what = `"${literal}"`): void {
    if (!this.#startsWith(literal)) {
      this.#fail(`Expected ${what}`)
    }
    this.#pos += literal.length
  }

  /** Consumes S; returns whether anything was consumed. */
  #space(): boolean {
    const start = this.#pos
    while (!this.#eof() && isSpace(this.#input.charCodeAt(this.#pos))) {
      this.#pos++
    }
    return this.#pos > start
  }

  #requireSpace(what: string): void {
    if (!this.#space()) {
      this.#fail(`Expected whitespace before ${what}`)
    }
  }

  /** Consumes up to (not including) `terminator`; fails at `start` if it never comes. Validates characters. */
  #until(terminator: string, what: string, start = this.#pos): string {
    const end = this.#input.indexOf(terminator, this.#pos)
    if (end === -1) {
      this.#fail(`Unterminated ${what}`, start)
    }
    const value = this.#input.slice(this.#pos, end)
    this.#checkChars(value, this.#pos)
    this.#pos = end + terminator.length
    return value
  }

  #checkChars(value: string, offset: number): void {
    // A lone surrogate is not iterated as a pair by for..of; find it explicitly.
    const lone = value.search(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/)
    let i = 0
    for (const char of value) {
      const code = char.codePointAt(0)!
      if (!isChar(code) || i === lone) {
        this.#fail(`Invalid character ${codeLabel(code)}`, offset + i)
      }
      i += char.length
    }
  }

  // -- names ----------------------------------------------------------------

  /** NCName ::= (NameStartChar - ':') (NameChar - ':')* */
  #ncName(what: string): string {
    const start = this.#pos
    if (!isNameStart(this.#peekCode())) {
      this.#fail(`Expected ${what}`)
    }
    while (!this.#eof() && isNameChar(this.#peekCode())) {
      this.#pos += this.#peekCode() > 0xffff ? 2 : 1
    }
    return this.#input.slice(start, this.#pos)
  }

  /** QName ::= PrefixedName | UnprefixedName; more than one colon or an empty part is an error. */
  #qName(what: string): { prefix: string, local: string, qualified: string, offset: number } {
    const offset = this.#pos
    const first = this.#ncName(what)
    if (this.#peekCode() !== 0x3a) {
      return { prefix: '', local: first, qualified: first, offset }
    }
    this.#pos++
    if (!isNameStart(this.#peekCode())) {
      this.#fail(`Expected local name after "${first}:"`)
    }
    const local = this.#ncName(what)
    if (this.#peekCode() === 0x3a) {
      this.#fail(`Unexpected ":" in name "${first}:${local}"`)
    }
    return { prefix: first, local, qualified: `${first}:${local}`, offset }
  }

  // -- references -----------------------------------------------------------

  /** Reads a reference at `&`; returns the replacement text. */
  #reference(): string {
    const start = this.#pos
    this.#pos++ // &
    if (this.#peekCode() === 0x23) { // #
      this.#pos++
      let code: number
      if (this.#peekCode() === 0x78) { // x
        this.#pos++
        const digits = this.#run(c => (c >= 0x30 && c <= 0x39) || (c >= 0x41 && c <= 0x46) || (c >= 0x61 && c <= 0x66))
        if (digits === '') {
          this.#fail('Expected hexadecimal digits in character reference', start)
        }
        code = parseInt(digits, 16)
      } else {
        const digits = this.#run(c => c >= 0x30 && c <= 0x39)
        if (digits === '') {
          this.#fail('Expected digits in character reference', start)
        }
        code = parseInt(digits, 10)
      }
      if (this.#peekCode() !== 0x3b) {
        this.#fail('Expected ";" after character reference', start)
      }
      this.#pos++
      if (!isChar(code)) {
        this.#fail(`Character reference to an invalid character (${this.#input.slice(start, this.#pos)})`, start)
      }
      return String.fromCodePoint(code)
    }
    if (!isNameStart(this.#peekCode())) {
      this.#fail('Expected entity name after "&"', start)
    }
    const name = this.#run(isNameChar)
    if (this.#peekCode() !== 0x3b) {
      this.#fail(`Expected ";" after entity name "${name}"`, start)
    }
    this.#pos++
    const replacement = predefinedEntities[name]
    if (replacement === undefined) {
      this.#fail(`Reference to undeclared entity "${name}" (only lt, gt, amp, apos and quot are supported; no DTD processing)`, start)
    }
    return replacement
  }

  /** Consumes a run of code points accepted by `predicate`. */
  #run(predicate: (c: number) => boolean): string {
    const start = this.#pos
    while (!this.#eof() && predicate(this.#peekCode())) {
      this.#pos += this.#peekCode() > 0xffff ? 2 : 1
    }
    return this.#input.slice(start, this.#pos)
  }

  // -- prolog ---------------------------------------------------------------

  document(): Ast.Document {
    const declaration = this.#declaration()
    const prelude: Ast.Document['prelude'] = []
    let doctype: undefined | Ast.Doctype
    while (true) {
      this.#space()
      if (this.#startsWith('<?')) {
        prelude.push(this.#processingInstruction())
      } else if (this.#startsWith('<!--')) {
        prelude.push(this.#comment())
      } else if (this.#startsWith('<!DOCTYPE')) {
        if (doctype) {
          this.#fail('Only one document type declaration is allowed')
        }
        doctype = this.#doctype()
        prelude.push(doctype)
      } else {
        break
      }
    }
    if (this.#eof()) {
      this.#fail('Expected root element')
    }
    if (!this.#startsWith('<')) {
      this.#fail('Character data outside the root element')
    }
    const root = this.#element()
    const epilogue: Ast.Document['epilogue'] = []
    while (true) {
      this.#space()
      if (this.#eof()) {
        break
      }
      if (this.#startsWith('<?')) {
        epilogue.push(this.#processingInstruction())
      } else if (this.#startsWith('<!--')) {
        epilogue.push(this.#comment())
      } else if (this.#startsWith('<')) {
        this.#fail('Only one root element is allowed')
      } else {
        this.#fail('Character data after the root element')
      }
    }
    return { type: 'Document', declaration, prelude, root, epilogue }
  }

  /** XMLDecl ::= '<?xml' VersionInfo EncodingDecl? SDDecl? S? '?>' — must be the very first thing. */
  #declaration(): undefined | Ast.Declaration {
    if (!/^<\?xml[\s?]/.test(this.#input)) {
      if (/^\s+<\?xml[\s?]/.test(this.#input)) {
        this.#fail('The XML declaration must be at the very start of the document', this.#input.search(/\S/))
      }
      return undefined
    }
    this.#pos = 5
    const attributes: Record<string, string> = {}
    const order: string[] = []
    while (true) {
      const spaced = this.#space()
      if (this.#startsWith('?>')) {
        this.#pos += 2
        break
      }
      if (this.#eof() || this.#startsWith('?')) {
        this.#fail('Unterminated XML declaration', 0)
      }
      if (!spaced) {
        this.#fail('Expected whitespace or "?>" in the XML declaration')
      }
      const name = this.#ncName('a pseudo-attribute name in the XML declaration')
      this.#space()
      this.#expect('=')
      this.#space()
      const value = this.#quoted('the XML declaration', false)
      if (name in attributes) {
        this.#fail(`Duplicate "${name}" in the XML declaration`)
      }
      attributes[name] = value
      order.push(name)
    }
    const allowed = [ 'version', 'encoding', 'standalone' ]
    for (const name of order) {
      if (!allowed.includes(name)) {
        this.#fail(`Unexpected "${name}" in the XML declaration`, 0)
      }
    }
    if (order[0] !== 'version') {
      this.#fail('The XML declaration must start with version', 0)
    }
    if (order.join(',') !== allowed.filter(name => name in attributes).join(',')) {
      this.#fail('The XML declaration must order version, encoding, standalone', 0)
    }
    if (!/^1\.[0-9]+$/.test(attributes.version)) {
      this.#fail(`Unsupported XML version "${attributes.version}"`, 0)
    }
    if (attributes.encoding !== undefined && !/^[A-Za-z][A-Za-z0-9._-]*$/.test(attributes.encoding)) {
      this.#fail(`Invalid encoding name "${attributes.encoding}"`, 0)
    }
    if (attributes.standalone !== undefined && attributes.standalone !== 'yes' && attributes.standalone !== 'no') {
      this.#fail(`Expected standalone to be "yes" or "no", got "${attributes.standalone}"`, 0)
    }
    return {
      type: 'Declaration',
      version: attributes.version,
      encoding: attributes.encoding,
      standalone: attributes.standalone === undefined ? undefined : attributes.standalone === 'yes'
    }
  }

  /** A quoted literal; `decode` applies attribute-value normalization and reference decoding. */
  #quoted(what: string, decode: boolean): string {
    const quote = this.#peekCode()
    if (quote !== 0x22 && quote !== 0x27) {
      this.#fail(`Expected a quoted value in ${what}`)
    }
    const start = this.#pos
    this.#pos++
    if (!decode) {
      const end = this.#input.indexOf(String.fromCharCode(quote), this.#pos)
      if (end === -1) {
        this.#fail(`Unterminated quoted value in ${what}`, start)
      }
      const value = this.#input.slice(this.#pos, end)
      this.#checkChars(value, this.#pos)
      this.#pos = end + 1
      return value
    }
    let value = ''
    while (true) {
      if (this.#eof()) {
        this.#fail(`Unterminated value of ${what}`, start)
      }
      const code = this.#peekCode()
      if (code === quote) {
        this.#pos++
        return value
      }
      if (code === 0x3c) {
        this.#fail(`"<" is not allowed in the value of ${what}`)
      }
      if (code === 0x26) {
        value += this.#reference()
        continue
      }
      // Attribute-value normalization: a literal white space character becomes a space.
      if (isSpace(code)) {
        value += ' '
        this.#pos++
        continue
      }
      if (!isChar(code)) {
        this.#fail(`Invalid character ${codeLabel(code)}`)
      }
      const char = String.fromCodePoint(code)
      value += char
      this.#pos += char.length
    }
  }

  #processingInstruction(): Ast.ProcessingInstruction {
    const start = this.#pos
    this.#pos += 2
    const target = this.#ncName('a processing instruction target')
    if (this.#peekCode() === 0x3a) {
      this.#fail('A processing instruction target cannot contain ":"')
    }
    if (target.toLowerCase() === 'xml') {
      this.#fail(start === 0 ? 'Malformed XML declaration' : 'The processing instruction target "xml" is reserved', start)
    }
    let value = ''
    if (this.#startsWith('?>')) {
      this.#pos += 2
    } else {
      this.#requireSpace('processing instruction data')
      value = this.#until('?>', 'processing instruction', start)
    }
    return { type: 'ProcessingInstruction', target, value }
  }

  #comment(): Ast.Comment {
    const start = this.#pos
    this.#pos += 4
    const value = this.#until('-->', 'comment', start)
    const doubleDash = value.indexOf('--')
    if (doubleDash !== -1) {
      this.#fail('"--" is not allowed inside a comment', start + 4 + doubleDash)
    }
    if (value.endsWith('-')) {
      this.#fail('A comment cannot end with "-" ("--->")', start + 4 + value.length - 1)
    }
    return { type: 'Comment', value }
  }

  /** doctypedecl ::= '<!DOCTYPE' S Name (S ExternalID)? S? ('[' intSubset ']' S?)? '>' */
  #doctype(): Ast.Doctype {
    const start = this.#pos
    this.#pos += 9
    this.#requireSpace('the document type name')
    const name = this.#qName('a document type name').qualified
    let publicId: undefined | string
    let systemId: undefined | string
    let internalSubset: undefined | string
    const spaced = this.#space()
    if (this.#startsWith('SYSTEM') || this.#startsWith('PUBLIC')) {
      if (!spaced) {
        this.#fail('Expected whitespace before the external identifier')
      }
      if (this.#startsWith('PUBLIC')) {
        this.#pos += 6
        this.#requireSpace('the public identifier')
        const offset = this.#pos
        publicId = this.#quoted('the public identifier', false)
        if (!/^[ \r\na-zA-Z0-9\-'()+,./:=?;!*#@$_%]*$/.test(publicId)) {
          this.#fail('Invalid character in the public identifier', offset)
        }
        this.#requireSpace('the system identifier')
      } else {
        this.#pos += 6
        this.#requireSpace('the system identifier')
      }
      const offset = this.#pos
      systemId = this.#quoted('the system identifier', false)
      if (systemId.includes('#')) {
        this.#fail('A system identifier cannot contain a fragment identifier ("#")', offset + 1 + systemId.indexOf('#'))
      }
      this.#space()
    }
    if (this.#startsWith('[')) {
      this.#pos++
      internalSubset = this.#internalSubset(start)
      this.#space()
    }
    if (!this.#startsWith('>')) {
      this.#fail('Expected ">" to end the document type declaration')
    }
    this.#pos++
    return { type: 'Doctype', name, publicId, systemId, internalSubset }
  }

  /**
   * intSubset ::= (markupdecl | DeclSep)* — checked structurally: each item
   * must be an ELEMENT/ATTLIST/ENTITY/NOTATION declaration (scanned to its
   * ">" with quoted literals stepped over), a comment, a processing
   * instruction, a parameter-entity reference or white space. The
   * declarations themselves are kept verbatim and never interpreted.
   */
  #internalSubset(start: number): string {
    const from = this.#pos
    while (true) {
      this.#space()
      if (this.#eof()) {
        this.#fail('Unterminated internal subset', start)
      }
      const code = this.#peekCode()
      if (code === 0x5d) { // ]
        const value = this.#input.slice(from, this.#pos)
        this.#checkChars(value, from)
        this.#pos++
        return value
      }
      if (this.#startsWith('<!--')) {
        this.#comment()
      } else if (this.#startsWith('<?')) {
        this.#processingInstruction()
      } else if (this.#startsWith('<!')) {
        this.#markupDeclaration()
      } else if (code === 0x25) { // %
        const offset = this.#pos
        this.#pos++
        this.#ncName('a parameter entity name')
        if (this.#peekCode() !== 0x3b) {
          this.#fail('Expected ";" after the parameter entity name', offset)
        }
        this.#pos++
      } else {
        this.#fail('Expected a markup declaration, comment, processing instruction or parameter entity reference in the internal subset')
      }
    }
  }

  /** `<!ELEMENT ...>`, `<!ATTLIST ...>`, `<!ENTITY ...>` or `<!NOTATION ...>`, scanned to its ">" (literals may contain ">"). */
  #markupDeclaration(): void {
    const start = this.#pos
    const keyword = [ 'ELEMENT', 'ATTLIST', 'ENTITY', 'NOTATION' ].find(name => this.#input.startsWith(name, this.#pos + 2))
    if (keyword === undefined) {
      this.#fail('Expected ELEMENT, ATTLIST, ENTITY or NOTATION after "<!" in the internal subset')
    }
    this.#pos += 2 + keyword.length
    this.#requireSpace(`the ${keyword} declaration content`)
    while (true) {
      if (this.#eof()) {
        this.#fail(`Unterminated ${keyword} declaration`, start)
      }
      const code = this.#peekCode()
      if (code === 0x3e) { // >
        this.#pos++
        return
      }
      if (code === 0x22 || code === 0x27) {
        const end = this.#input.indexOf(String.fromCharCode(code), this.#pos + 1)
        if (end === -1) {
          this.#fail(`Unterminated literal in the ${keyword} declaration`)
        }
        this.#pos = end + 1
      } else if (code === 0x3c) { // <
        this.#fail(`"<" is not allowed inside the ${keyword} declaration`)
      } else if (code === 0x5d) { // ] — the subset ended before the declaration did
        this.#fail(`Unterminated ${keyword} declaration`, start)
      } else {
        this.#pos += code > 0xffff ? 2 : 1
      }
    }
  }

  // -- elements -------------------------------------------------------------

  /** Parses the root element and everything below it iteratively (no recursion, so depth is unbounded). */
  #element(): Ast.Element {
    const stack: Frame[] = []
    let root: undefined | Ast.Element
    let text = ''
    let textStart = -1

    const flushText = () => {
      if (textStart !== -1) {
        stack[stack.length - 1].element.items.push({ type: 'Text', value: text })
        text = ''
        textStart = -1
      }
    }
    const push = (item: Ast.Item) => {
      flushText()
      stack[stack.length - 1].element.items.push(item)
    }

    while (true) {
      if (stack.length > 0 && this.#eof()) {
        this.#fail(`Unterminated element "${stack[stack.length - 1].qualified}"`)
      }
      if (this.#startsWith('</')) {
        flushText()
        const start = this.#pos
        this.#pos += 2
        const name = this.#qName('an end tag name')
        this.#space()
        this.#expect('>', '">" to end the end tag')
        const frame = stack.pop()!
        if (name.qualified !== frame.qualified) {
          this.#fail(`End tag "</${name.qualified}>" does not match start tag "<${frame.qualified}>"`, start)
        }
        if (stack.length === 0) {
          return root!
        }
      } else if (this.#startsWith('<?')) {
        push(this.#processingInstruction())
      } else if (this.#startsWith('<!--')) {
        push(this.#comment())
      } else if (this.#startsWith('<![CDATA[')) {
        const start = this.#pos
        this.#pos += 9
        push({ type: 'Cdata', value: this.#until(']]>', 'CDATA section', start) })
      } else if (this.#startsWith('<!')) {
        this.#fail(this.#startsWith('<!DOCTYPE') ? 'A document type declaration is only allowed before the root element' : 'Expected a comment or CDATA section after "<!"')
      } else if (this.#startsWith('<')) {
        flushText()
        const { element, qualified, bindings, empty } = this.#startTag(stack[stack.length - 1]?.bindings ?? rootBindings)
        if (stack.length === 0) {
          root = element
        } else {
          stack[stack.length - 1].element.items.push(element)
        }
        if (!empty) {
          stack.push({ element, qualified, bindings })
        } else if (stack.length === 0) {
          return element
        }
      } else if (this.#startsWith('&')) {
        if (textStart === -1) {
          textStart = this.#pos
        }
        text += this.#reference()
      } else {
        // Character data up to the next markup; `]]>` is not allowed here.
        const code = this.#peekCode()
        if (this.#startsWith(']]>')) {
          this.#fail('"]]>" is not allowed in character data')
        }
        if (!isChar(code)) {
          this.#fail(`Invalid character ${codeLabel(code)}`)
        }
        if (textStart === -1) {
          textStart = this.#pos
        }
        const char = String.fromCodePoint(code)
        text += char
        this.#pos += char.length
      }
    }
  }

  /** STag | EmptyElemTag, with namespace processing. */
  #startTag(parentBindings: ReadonlyMap<string, string>): { element: Ast.Element, qualified: string, bindings: ReadonlyMap<string, string>, empty: boolean } {
    const start = this.#pos
    this.#pos++ // <
    const name = this.#qName('an element name')
    const rawAttributes: Array<{ prefix: string, local: string, qualified: string, value: string, offset: number }> = []
    const qualifiedNames = new Set<string>()
    let bindings: Map<string, string> | undefined
    let empty = false
    while (true) {
      const spaced = this.#space()
      if (this.#startsWith('/>')) {
        this.#pos += 2
        empty = true
        break
      }
      if (this.#startsWith('>')) {
        this.#pos++
        break
      }
      if (this.#eof()) {
        this.#fail(`Unterminated start tag "<${name.qualified}"`, start)
      }
      if (!spaced) {
        this.#fail(`Expected whitespace, ">" or "/>" after "${rawAttributes.length > 0 ? rawAttributes[rawAttributes.length - 1].qualified : name.qualified}"`)
      }
      const attribute = this.#qName('an attribute name')
      this.#space()
      this.#expect('=', `"=" after attribute name "${attribute.qualified}"`)
      this.#space()
      const value = this.#quoted(`attribute "${attribute.qualified}"`, true)
      if (qualifiedNames.has(attribute.qualified)) {
        this.#fail(`Duplicate attribute "${attribute.qualified}"`, attribute.offset)
      }
      qualifiedNames.add(attribute.qualified)
      // Namespace declarations bind for this element and its descendants (including its own name).
      if (attribute.qualified === 'xmlns' || attribute.prefix === 'xmlns') {
        bindings ??= new Map(parentBindings)
        const prefix = attribute.prefix === 'xmlns' ? attribute.local : ''
        if (prefix === 'xmlns') {
          this.#fail('The prefix "xmlns" cannot be declared', attribute.offset)
        }
        if (prefix === 'xml' && value !== xmlNamespace) {
          this.#fail(`The prefix "xml" is bound to ${xmlNamespace} and cannot be rebound`, attribute.offset)
        }
        if (prefix !== 'xml' && value === xmlNamespace) {
          this.#fail(`Only the prefix "xml" can be bound to ${xmlNamespace}`, attribute.offset)
        }
        if (value === xmlnsNamespace) {
          this.#fail(`Nothing can be bound to ${xmlnsNamespace}`, attribute.offset)
        }
        if (prefix !== '' && value === '') {
          this.#fail(`The prefix "${prefix}" cannot be bound to an empty namespace name`, attribute.offset)
        }
        if (prefix === '' && value === '') {
          bindings.delete('')
        } else {
          bindings.set(prefix, value)
        }
      }
      rawAttributes.push({ ...attribute, value })
    }
    const scope = bindings ?? parentBindings
    const resolve = (prefix: string, offset: number, qualified: string): undefined | string => {
      const namespace = scope.get(prefix)
      if (prefix !== '' && namespace === undefined) {
        this.#fail(`Undeclared namespace prefix "${prefix}" in "${qualified}"`, offset)
      }
      return namespace
    }
    const attributes: Ast.Attribute[] = rawAttributes.map(attribute => ({
      type: 'Attribute',
      name: {
        prefix: attribute.prefix,
        local: attribute.local,
        namespace: attribute.qualified === 'xmlns' || attribute.prefix === 'xmlns' ?
          xmlnsNamespace :
          attribute.prefix === '' ? undefined : resolve(attribute.prefix, attribute.offset, attribute.qualified)
      },
      value: attribute.value
    }))
    // Two attributes may not resolve to the same expanded name through different prefixes.
    const expandedNames = new Map<string, number>()
    attributes.forEach((attribute, i) => {
      if (attribute.name.namespace === undefined) {
        return
      }
      const key = `{${attribute.name.namespace}}${attribute.name.local}`
      const previous = expandedNames.get(key)
      if (previous !== undefined) {
        this.#fail(`Attributes "${rawAttributes[previous].qualified}" and "${rawAttributes[i].qualified}" both resolve to ${key}`, rawAttributes[i].offset)
      }
      expandedNames.set(key, i)
    })
    const element: Ast.Element = {
      type: 'Element',
      name: {
        prefix: name.prefix,
        local: name.local,
        namespace: resolve(name.prefix, name.offset, name.qualified)
      },
      attributes,
      items: []
    }
    return { element, qualified: name.qualified, bindings: scope, empty }
  }
}

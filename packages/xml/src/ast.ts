/**
 * A qualified name after namespace processing.
 *
 * `prefix` is the part before the colon (`''` when unprefixed) and `local` the
 * part after it. `namespace` is the URI the prefix is bound to — for an
 * unprefixed element name the default namespace in scope — or `undefined`
 * when there is none. Unprefixed attribute names never have a namespace.
 */
export type Name = {
  prefix: string,
  local: string,
  namespace: undefined | string
}

/** Attribute with a resolved name and its normalized, reference-decoded value. */
export type Attribute = {
  type: 'Attribute',
  name: Name,
  value: string
}

/** The XML declaration (`<?xml version="1.0" ...?>`); not a processing instruction. */
export type Declaration = {
  type: 'Declaration',
  version: string,
  encoding: undefined | string,
  standalone: undefined | boolean
}

/** Processing instruction with its target and (possibly empty) data. */
export type ProcessingInstruction = {
  type: 'ProcessingInstruction',
  target: string,
  value: string
}

export type Comment = {
  type: 'Comment',
  value: string
}

/** Character data with references decoded and line ends normalized. Adjacent character data is one node. */
export type Text = {
  type: 'Text',
  value: string
}

export type Cdata = {
  type: 'Cdata',
  value: string
}

/**
 * Document type declaration. The internal subset, if any, is kept verbatim
 * (without the enclosing brackets) and is not interpreted: no entity or
 * attribute defaults are applied, and nothing external is ever fetched.
 */
export type Doctype = {
  type: 'Doctype',
  name: string,
  publicId: undefined | string,
  systemId: undefined | string,
  internalSubset: undefined | string
}

export type Element = {
  type: 'Element',
  name: Name,
  attributes: Attribute[],
  items: Item[] // eslint-disable-line no-use-before-define
}

export type Document = {
  type: 'Document',
  declaration: undefined | Declaration,
  /** Comments, processing instructions and the doctype before the root element, in order. */
  prelude: (ProcessingInstruction | Doctype | Comment)[],
  root: Element,
  /** Comments and processing instructions after the root element, in order. */
  epilogue: (ProcessingInstruction | Comment)[]
}

/** Content of an element. */
export type Item =
  | ProcessingInstruction
  | Comment
  | Text
  | Cdata
  | Element


/** Name without namespace. */
export type LocalName =
  string

/** Name with namespace. */
export type NamespacedName = {
  namespace: string,
  name: string
}

/** Name with or without namespace. */
export type Name =
  | LocalName
  | NamespacedName

/** Attribute with name and value. */
export type Attribute = {
  type: 'Attribute',
  name: Name,
  value: string
}

export type ProcessingInstruction = {
  type: 'ProcessingInstruction',
  value: string
}

export type Comment = {
  type: 'Comment',
  value: string
}

export type Text = {
  type: 'Text',
  value: string
}

export type Cdata = {
  type: 'Cdata',
  value: string
}

export type Doctype = {
  type: 'Doctype',
  value: string
}

export type Element = {
  type: 'Element',
  name: Name,
  attributes: Attribute[],
  items: Item[] // eslint-disable-line no-use-before-define
}

export type Document = {
  type: 'Document',
  prelude: (ProcessingInstruction | Doctype | Comment)[],
  root: Element
}

export type Item =
  | ProcessingInstruction
  | Comment
  | Text
  | Cdata
  | Doctype
  | Element

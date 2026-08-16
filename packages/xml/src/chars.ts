// Character classes of XML 1.0 (Fifth Edition) and Namespaces in XML 1.0, by code point.

/** Char ::= #x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF] */
export const isChar =
  (c: number): boolean =>
    c === 0x9 || c === 0xa || c === 0xd ||
    (c >= 0x20 && c <= 0xd7ff) ||
    (c >= 0xe000 && c <= 0xfffd) ||
    (c >= 0x10000 && c <= 0x10ffff)

/** S ::= (#x20 | #x9 | #xD | #xA)+ */
export const isSpace =
  (c: number): boolean =>
    c === 0x20 || c === 0x9 || c === 0xa || c === 0xd

/** NameStartChar without ":" (an NCName start character). */
export const isNameStart =
  (c: number): boolean =>
    (c >= 0x61 && c <= 0x7a) || (c >= 0x41 && c <= 0x5a) || c === 0x5f ||
    (c >= 0xc0 && c <= 0xd6) || (c >= 0xd8 && c <= 0xf6) || (c >= 0xf8 && c <= 0x2ff) ||
    (c >= 0x370 && c <= 0x37d) || (c >= 0x37f && c <= 0x1fff) || (c >= 0x200c && c <= 0x200d) ||
    (c >= 0x2070 && c <= 0x218f) || (c >= 0x2c00 && c <= 0x2fef) || (c >= 0x3001 && c <= 0xd7ff) ||
    (c >= 0xf900 && c <= 0xfdcf) || (c >= 0xfdf0 && c <= 0xfffd) || (c >= 0x10000 && c <= 0xeffff)

/** NameChar without ":" (an NCName character). */
export const isNameChar =
  (c: number): boolean =>
    isNameStart(c) || c === 0x2d || c === 0x2e || (c >= 0x30 && c <= 0x39) || c === 0xb7 ||
    (c >= 0x300 && c <= 0x36f) || (c >= 0x203f && c <= 0x2040)

/** The five predefined entities. */
export const predefinedEntities: Readonly<Record<string, string>> = {
  lt: '<',
  gt: '>',
  amp: '&',
  apos: '\'',
  quot: '"'
}

export const xmlNamespace = 'http://www.w3.org/XML/1998/namespace'
export const xmlnsNamespace = 'http://www.w3.org/2000/xmlns/'

# Parser combinators module

# Usage

```bash
npm i -E @prelude/parser
```

```ts
import * as P from '@prelude/parser'
```

# Rules

* [rfc4180](https://datatracker.ietf.org/doc/html/rfc4180) - CSV
* [rfc5234](https://datatracker.ietf.org/doc/html/rfc5234) – ABNF
* [rfc8259](https://datatracker.ietf.org/doc/html/rfc8259) – JSON

## Top level rules

* char-range
* either
* between
* parser
* lit
* map
* maybe
* pair
* right
* sep0 (alias: separated0)
* sep1 (alias: separated1)
* sep2 (alias: separated2)
* seq (alias: sequence)
* star
* times
* trim
* first
* chars
* ws0
* ws1

## Top level helpers

* Input
* Invalid
* join
* ParserResult
* Rfc8259

## [rfc5234](https://datatracker.ietf.org/doc/html/rfc5234) – Augmented BNF for Syntax Specifications: ABNF

* alpha
* bit
* char

## [rfc8259](https://datatracker.ietf.org/doc/html/rfc8259) – The JavaScript Object Notation (JSON) Data Interchange Format

* false
* null
* trim
* true
* ws

# Parser module

* `dquote: Parser<string>`

* `dquote2: Parser<string>`

* `lf: Parser<string>`

* `cr: Parser<string>`

* `nl: Parser<string>`

* `textdata: Parser<string>`

* `comma: Parser<string>`

* `nonEscaped: Parser<string>`

* `escaped: Parser<string>`

* `field: Parser<string>`

* `record: Parser<string[]>`

* `file: Parser<string[][]>`

* `parse: (inputString: string) => string[][]`

* `false: Parser<boolean>`

* `null: Parser<any>`

* `parse: (inputString: string) => unknown`

* `true: Parser<boolean>`

* `valueSeparator: Parser<string>`

* `charRange: (ranges: string) => Parser<string>`

  Returns parser matching provided character `ranges`.

  Example `charRange('09azAZ')` – equivalent to /[0-9a-zA-Z]/ regexp.

* `Csv`

* `either: <A, B>(a: Parser<A>, b: Parser<B>) => Parser<A | B>`

* `parser: <A>(a: Parser<A>) => (inputString: string) => A`

  Returns top level string to result parser asserting all input has been parsed.

  Throws If parser fails or input is not fully exhausted.

* `join: (a: Parser<string[]>, glue?: string) => Parser<string>`

  Joins `string` (or `undefined`) result array into single `string` result.

* `Json`

* `lit: <T extends string>(...literals: T[]) => Parser<T>` (alias: `literal`)

* `map: <A, B>(a: Parser<A>, f: (_: A) => B) => Parser<B>`

* `maybe: <A>(a: Parser<A>) => Parser<A>`

* `pair: <A, B>(a: Parser<A>, b: Parser<B>) => Parser<[A, B]>`

* `Rfc4180`

* `Rfc8259`

* `right: <B>(a: Parser<unknown>, b: Parser<B>) => Parser<B>`

  Returns `b` after successful `a` and `b` sequence match.

* `sep0: <A>(s: Parser<unknown>, a: Parser<A>) => Parser<A[]>`

* `sep1: <A>(s: Parser<unknown>, a: Parser<A>) => Parser<A[]>`

* `sep2: <A>(s: Parser<unknown>, a: Parser<A>) => Parser<A[]>`

* `seq: <T extends Parser<unknown>[]>(...as: T) => Parser<{ [K in keyof T]: Parsed<T[K]>; }>`

* `between: <A>(lhs: Parser<unknown>, rhs: Parser<unknown>, a: Parser<A>) => Parser<A>`

  Returns `a` parser surrounded by `lhs` and `rhs`.

* `between1: <A>(s: Parser<unknown>, a: Parser<A>) => Parser<A>`

  Returns `a` parser surrounded by `s` at the beginning and at the end.

* `star: <A>(a: Parser<A>, min?: number) => Parser<A[]>`

  Returns parser matching at least `min` (default 0) times `a` parser.

* `times: <A>(n: number, a: Parser<A>) => Parser<A[]>`

* `trim: <A>(a: Parser<A>) => Parser<A>`

* `first: <T extends Parser<unknown>[]>(...as: T) => T[number]`

* `chars: (chars: string) => Parser<string>`

  Returns parser matching one of provided chars.

* `whileChars: (chars: string, min?: number) => Parser<string>`

  Matches any char listed in `chars` at least `min` (default `0`) times.

* `ws0: Parser<string>`

* `ws1: Parser<string>`

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).

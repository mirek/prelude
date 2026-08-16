# Json

Json package aims at providing concise solution to the problem of encoding and decoding non JSON native data types.

For example:

```ts
import * as Json from '@prelude/json'
const encoded = Json.stringify({ xs: new Set([ 3, 5, 7 ]) }) // {"xs":{"^Set$":[3,5,7]}}
const decoded = Json.parse(encoded) // { xs: Set { 3, 5, 7 } }
```

Default coder supports [types supported by structured clone](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#supported_types) ie. types for which it makes sense to serialize and deserialize.

Custom coders can be created by registering their prototype's constructor function (ie. classes) for encoder and name based decoder.

```ts
import * as Json from '@prelude/json'

class Foo {}

// Clone global config.
const custom = Json.of(Json.global)

// Register custom codec for Foo.
Json.register(custom, {
  constructor: Foo,
  name: 'Foo',
  encode: () => ({ '^Foo$': true }),
  decode: (value: unknown) => {
    if (value !== true) {
      throw new Error('Expected true')
    }
    return new Foo()
  }
})

// Serialize Foo.
const encoded = custom.stringify({ foo: new Foo() }) // {"foo":{"^Foo$":true}}

// Deserialize Foo.
const decoded = custom.parse(encoded) // { foo: Foo {} }
```

Encoding scheme is called _recoder_.

## Recoder coding

JSON types are encoded as is.

Non JSON types are encoded using property name suffix `^Foo$`.

Decoding decodes value and strips suffix.

Objects with single empty property name are promoted up.

```json
{"foo":{"":"bar"}}
```

...becomes:

```json
{"foo":"bar"}
```

Encoded types can be arbitrarily nested, ie:

```json
{"foo":{"^Set$":[{"^Date$":"2024-07-05T07:11:49.811Z"}]}}
```

Above example encodes a set with a single date element and is equivalent to:

```json
{"foo^Set$":[{"^Date$":"2024-07-05T07:11:49.811Z"}]}
```

In general `{"foo":{"^Foo$":{"^Bar$":...}}}` is equivalent to `{"foo^Foo$^Bar$":...}`.

### Nulls

Custom encoding always supports `null` value:

```json
{"^Set$":null}
```

...will always decode to `null`.

# Usage

```bash
pnpm i -E @prelude/json
```

```ts
import * as Json from '@prelude/json'
const encoded = Json.stringify({ xs: new Set([ 3, 5, 7 ]) })) // {"xs":{"^Set$":[3,5,7]}}
const decoded = Json.parse(encoded) // { xs: Set { 3, 5, 7 } }
```

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).

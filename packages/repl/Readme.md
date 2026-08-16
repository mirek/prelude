# @prelude/repl

Node.js helpers for running code snippets in a sandbox: `runInContext` evaluates source with every builtin module and common globals preloaded, `extractCode` pulls ```` ```!js ```` blocks out of Markdown and `extractAndRun` executes them in order, yielding each result. Intended for executable documentation and quick experiments.

# Usage

```bash
npm i -E @prelude/repl
```

```ts
import * as Repl from '@prelude/repl'

for await (const result of Repl.extractAndRun(markdown)) {
  console.log(result)
}
```

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).

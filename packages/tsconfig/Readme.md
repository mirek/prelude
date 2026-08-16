# @prelude/tsconfig

Shared TypeScript configurations for the `@prelude/*` packages, usable from any project.

# Usage

```bash
npm i -D -E @prelude/tsconfig typescript
```

Extend one of the published configs (all of them share `base.json`: `target`/`lib` ES2024 plus the ES2025 iterator helpers, `Set` methods and disposable symbols that Node.js 22 ships, `module: NodeNext`, `strict`):

```json
{
  "extends": "@prelude/tsconfig/isomorphic.json",
  "include": ["src/**/*.ts"]
}
```

| Config | For | Notes |
| --- | --- | --- |
| `isomorphic.json` | Libraries that must run in Node.js, browsers, workers and edge runtimes | `types: []`; only the globals declared in `isomorphic.d.ts` (timers, `queueMicrotask`, `console`, `AbortController`, `TextEncoder`/`TextDecoder`) are visible, so Node APIs fail to compile. |
| `backend.json` | Node.js-only libraries | `types: ["node"]`; bring your own `@types/node`. |
| `test.json` | Test projects | Node types, `noEmit`. |
| `javascript-backend.json` | Type-checking plain `.mjs` scripts | `allowJs`, `checkJs`, `noEmit`. |

The `workspace-*.json` variants exist only inside the prelude repository (they alias `@prelude/*` to sibling sources) and are not published.

Requires TypeScript 6 or later (declared as a peer dependency).

# License

This package is dedicated to the public domain under [CC0 1.0](./License.md).

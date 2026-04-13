import * as EvalJs from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('simple', async () => {
  const results: unknown[] = []
  const markdown = `

Please execute those two for me:

\`\`\`!js
  1+1
\`\`\`

and this:

\`\`\`!js
new Promise(resolve => setTimeout(() => resolve(42), 10))
\`\`\`

`
  for await (const result of EvalJs.extractAndRun(markdown)) {
    results.push(result)
  }
  assert.deepEqual(results, [2, 42])
})

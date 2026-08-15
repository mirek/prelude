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

await test('extractCode handles a closing fence at end of input and CRLF endings', () => {
  assert.deepEqual(EvalJs.extractCode('```!js\n1+1\n```'), [ '1+1' ])
  assert.deepEqual(EvalJs.extractCode('```!js\r\n1+1\r\n```\r\n'), [ '1+1' ])
  assert.deepEqual(EvalJs.extractCode('```!javascript\r\nconst a = 1\r\na + 1\r\n```\r\ntext\r\n```!js\r\n2\r\n```'), [ 'const a = 1\r\na + 1', '2' ])
  assert.deepEqual(EvalJs.extractCode('```js\n1+1\n```\n'), [])
  assert.deepEqual(EvalJs.extractCode('```!js\n1+1\n```   \nrest'), [ '1+1' ])
})

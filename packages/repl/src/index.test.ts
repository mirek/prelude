import { test, expect } from '@jest/globals'
import * as EvalJs from './index.js'

test('simple', async () => {
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
  expect(results).toEqual([2, 42])
})

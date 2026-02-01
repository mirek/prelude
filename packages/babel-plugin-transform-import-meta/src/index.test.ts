import { test, expect } from '@jest/globals'
import { transform } from '@babel/core'
import plugin from './index.js'

const t = (code: string) => {
  const result = transform(code, {
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            node: 'current'
          },
          modules: 'commonjs'
        }
      ],
      '@babel/preset-typescript'
    ],
    plugins: [plugin],
    configFile: false,
    filename: 'test.ts'
  })
  return result?.code
}

test.each([
  `
import * as Path from 'node:path'
const root = Path.join(new URL('.', import.meta.url).pathname, '../')
console.log(root)
`
])('%s', input => {
  expect(t(input)).toMatchSnapshot()
})

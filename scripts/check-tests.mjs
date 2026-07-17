import { readFileSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const root = fileURLToPath(new URL('..', import.meta.url))
const packages = path.join(root, 'packages')

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(directory, entry.name)
    return entry.isDirectory() ? files(target) : [ target ]
  })
}

function location(source, node) {
  const position = source.getLineAndCharacterOfPosition(node.getStart(source))
  return `${path.relative(root, source.fileName)}:${position.line + 1}:${position.character + 1}`
}

function isMathRandom(node) {
  return ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    ts.isIdentifier(node.expression.expression) &&
    node.expression.expression.text === 'Math' &&
    node.expression.name.text === 'random'
}

function isNumericExpression(node) {
  return ts.isNumericLiteral(node) ||
    ts.isPrefixUnaryExpression(node) ||
    ts.isBinaryExpression(node)
}

function isTestCall(node) {
  if (!ts.isCallExpression(node)) {
    return false
  }
  if (ts.isIdentifier(node.expression)) {
    return node.expression.text === 'test' || node.expression.text === 'it'
  }
  return ts.isPropertyAccessExpression(node.expression) &&
    (node.expression.name.text === 'test' || node.expression.name.text === 'it')
}

const failures = []
const testFiles = files(packages)
  .filter(file => /\.test\.[cm]?[jt]sx?$/.test(file))
  .filter(file => file.includes(`${path.sep}src${path.sep}`))
  .sort()

for (const file of testFiles) {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  )

  function visit(node) {
    if (isMathRandom(node)) {
      failures.push(`${location(source, node)} uses unseeded Math.random() in the default test suite`)
    }

    if (isTestCall(node) && node.arguments.length >= 3 && isNumericExpression(node.arguments[2])) {
      failures.push(`${location(source, node.arguments[2])} passes a numeric third argument to node:test; use the options position`)
    }

    ts.forEachChild(node, visit)
  }

  visit(source)
}

if (failures.length > 0) {
  throw new Error(`Non-deterministic test patterns found:\n${failures.map(failure => `- ${failure}`).join('\n')}`)
}

console.log(`Checked ${testFiles.length} default test files for deterministic patterns.`)

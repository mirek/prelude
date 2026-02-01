import { template } from '@babel/core'
import type { PluginObj, NodePath } from '@babel/core'
import type { MetaProperty, Program } from '@babel/types'

const buildImportMetaReplacement = template.expression(
  `{
  dirname: __dirname,
  filename: __filename,
  url: new URL(\`file://\${__filename}\`).toString(),
  resolve: (specifier) => new URL(\`file://\${require.resolve(specifier)}\`).toString()
}`,
  { syntacticPlaceholders: true }
)

/**
 * Babel plugin to transform `import.meta` into a CommonJS-compatible object.
 * Allows using `import.meta.url`, `import.meta.filename`, etc., in CJS environments.
 */
export default function (): PluginObj {
  return {
    name: 'transform-import-meta',

    visitor: {
      Program(programPath: NodePath<Program>) {
        // Store paths to replace
        const importMetaPaths: NodePath<MetaProperty>[] = []

        // Find all `import.meta` occurrences
        programPath.traverse({
          MetaProperty(metaPath: NodePath<MetaProperty>) {
            const { node } = metaPath
            if (node.meta.name === 'import' && node.property.name === 'meta') {
              importMetaPaths.push(metaPath)
            }
          }
        })

        // If no import.meta found, do nothing
        if (importMetaPaths.length === 0) {
          return
        }

        // Generate a unique identifier for the replacement variable
        const replacementId = programPath.scope.generateUidIdentifier('importMeta')

        const replacementVarDecl = template.statement(`const %%replacementId%% = %%replacementObject%%;`, {
          syntacticPlaceholders: true
        })({
          replacementId: replacementId,
          replacementObject: buildImportMetaReplacement()
        })

        // Add the variable declaration to the top of the program
        programPath.node.body.unshift(replacementVarDecl)

        // Replace all `import.meta` occurrences with the identifier
        for (const metaPath of importMetaPaths) {
          // Check if the path still exists (it might have been removed by other plugins)
          if (metaPath.node) {
            metaPath.replaceWith(replacementId)
          }
        }
      }
    }
  }
}

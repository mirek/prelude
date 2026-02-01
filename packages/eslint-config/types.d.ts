declare module 'eslint-plugin-import' {
  import type { FixupConfig } from '@eslint/compat'
  export const configs: Record<'typescript', FixupConfig>
}

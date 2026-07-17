# TODO

This index contains outstanding work only, ordered by importance. When an item is addressed, delete its `todo/*.md` file and remove its index entry; do not add status fields or retain completed items.

- [Make asynchronous tests deterministic](todo/make-async-tests-deterministic.md) — Replace random sleeps and ignored timeout arguments with deterministic synchronization and valid test options.
- [Make filesystem fixtures portable](todo/make-filesystem-fixtures-portable.md) — Stop relying on repository symlinks that can be rewritten or disabled by checkout and archive tools.
- [Complete XML parser conformance](todo/complete-xml-parser-conformance.md) — Cover ordinary doctypes, entities, Unicode, element content, and malformed input with an explicit supported subset.
- [Integrate or remove the graph prototype](todo/integrate-or-remove-graph-prototype.md) — Resolve the two incompatible graph models and either make the package buildable/tested or remove it.
- [Rehabilitate or remove the docs package](todo/rehabilitate-or-remove-docs-package.md) — Fix its unusable CLI and skipped build/test lifecycle or retire the package.
- [Add invariant tests for core data structures](todo/add-data-structure-invariant-tests.md) — Property-test red-black trees, tries, range sets, queues, and channels against simple reference models.
- [Unify validation package internals](todo/unify-validation-package-internals.md) — Remove duplicated object, tuple, primitive, and combinator logic across assert, predicate, and refute.
- [Define cancellation for asynchronous utilities](todo/define-async-cancellation.md) — Add a consistent abort contract for generators, channels, queues, timers, and event waits.
- [Normalize package documentation and metadata](todo/normalize-package-documentation-and-metadata.md) — Remove stale generated content and make package purpose, licensing, links, and examples accurate.
- [Define the supported runtime matrix](todo/define-supported-runtime-matrix.md) — Declare Node and TypeScript compatibility instead of combining `ESNext`, Node 25 types, and a vague LTS recommendation.

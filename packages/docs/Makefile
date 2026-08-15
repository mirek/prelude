clean:
	@rm -Rf mjs test/*.js

build-mjs:
	@rm -Rf mjs
	@pnpm tsc -d --sourceMap --outDir mjs --rootDir src

build:
	@echo "docs: build skipped"

rebuild: clean build

test:
	@echo "no tests"

update:
	@pnpm npm-check --update --save-exact

.PHONY: test

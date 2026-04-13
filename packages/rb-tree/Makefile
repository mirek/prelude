clean:
	@rm -Rf mjs test/*.js

build-mjs:
	@rm -Rf mjs
	@pnpm tsc -p tsconfig.lib.json -d --sourceMap --outDir mjs --rootDir src

build: build-mjs

rebuild: clean build

test:
	pnpm tsx --test test/**/*.test.ts

update:
	@pnpm npm-check --update --save-exact

postversion:
	@git push
	@git push --tags
	@npm publish

.PHONY: test

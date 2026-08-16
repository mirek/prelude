clean:
	@rm -Rf mjs test/*.js

build-mjs:
	@node ../../scripts/build-package.mjs

build: build-mjs

rebuild: clean build

test: rebuild
	pnpm tsx --test 'src/**/*.test.ts'

update:
	@pnpm npm-check --update --save-exact

.PHONY: test

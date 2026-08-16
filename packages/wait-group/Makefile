test: rebuild
	node --test mjs

clean:
	rm -Rf mjs test/*.js

build-mjs:
	node ../../scripts/build-package.mjs

build: build-mjs

rebuild: clean build

update:
	pnpm npm-check --update --save-exact

install:
	pnpm i

ci: install test

.PHONY: test

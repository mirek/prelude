clean:
	rm -Rf mjs test/*.js

build-mjs:
	node ../../scripts/build-package.mjs

build: build-mjs

rebuild: clean build

test:
	pnpm t

update:
	pnpm npm-check --update --save-exact

.PHONY: test

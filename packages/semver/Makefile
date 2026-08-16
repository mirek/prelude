test:
	pnpm t

clean:
	rm -Rf mjs test/*.js

build-mjs:
	node ../../scripts/build-package.mjs

build: build-mjs

rebuild: clean build

update:
	pnpm up --latest

.PHONY: test

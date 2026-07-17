test:
	pnpm t

clean:
	rm -Rf mjs src/*.js test/*.js

build-mjs:
	rm -Rf mjs
	pnpm exec tsc -p tsconfig.lib.json -d --sourceMap --outDir mjs --rootDir src

build: build-mjs

rebuild: clean build

update:
	pnpm up --latest

.PHONY: test

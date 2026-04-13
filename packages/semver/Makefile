test:
	pnpm t

clean:
	rm -Rf mjs test/*.js

build-mjs:
	rm -Rf mjs
	pnpm exec tsc -p tsconfig.lib.json -d --sourceMap --outDir mjs --rootDir src

build: build-mjs

rebuild: clean build

update:
	pnpm up --latest

preversion: rebuild test

postversion:
	git push
	git push --tags
	pnpm publish --access public

.PHONY: test

clean:
	rm -Rf mjs test/*.js

build-mjs:
	rm -Rf mjs
	pnpm tsc -p tsconfig.lib.json -d --sourceMap --outDir mjs --rootDir src

build: build-mjs

rebuild: clean build

test:
	pnpm t

update:
	pnpm npm-check --update --save-exact

preversion: rebuild test

postversion:
	git push
	git push --tags
	pnpm publish --access public

.PHONY: test

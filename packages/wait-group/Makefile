test: rebuild
	node --test mjs

clean:
	rm -Rf mjs test/*.js

build-mjs:
	rm -Rf mjs
	pnpm tsc -p tsconfig.lib.json -d -t es2022 --sourceMap --outDir mjs --rootDir src

build: build-mjs

rebuild: clean build

update:
	pnpm npm-check --update --save-exact

postversion:
	git push
	git push --tags
	npm publish --access public

install:
	pnpm i

ci: install test

.PHONY: test

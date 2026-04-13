test:
	pnpm tsx --test src/**/*.test.ts

clean:
	rm -Rf mjs test/*.js

build-mjs:
	rm -Rf mjs
	pnpm exec tsc -p tsconfig.lib.json -d --sourceMap --outDir mjs --rootDir src

build: build-mjs

rebuild: clean build

update:
	pnpm up --latest

preversion: test rebuild

postversion:
	git push
	git push --tags
	pnpm publish

.PHONY: test

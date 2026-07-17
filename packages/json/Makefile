test:
	pnpm tsc
	pnpm oxlint --type-aware src
	pnpm tsx --test src/**/*.test.ts

clean:
	rm -Rf mjs test/*.js

build-mjs:
	rm -Rf mjs
	pnpm exec tsc -p tsconfig.mjs.json

build: build-mjs

rebuild: clean build

update:
	pnpm up --latest

.PHONY: test

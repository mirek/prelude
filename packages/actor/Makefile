test:
	pnpm t

clean:
	rm -Rf mjs

build-mjs:
	rm -Rf mjs
	pnpm exec tsc -p tsconfig.lib.json -d --sourceMap --outDir mjs --rootDir src

build: build-mjs

rebuild: clean build

.PHONY: test clean build build-mjs rebuild

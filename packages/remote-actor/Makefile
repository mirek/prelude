test:
	pnpm t

clean:
	rm -Rf mjs

build-mjs:
	node ../../scripts/build-package.mjs

build: build-mjs

rebuild: clean build

.PHONY: test clean build build-mjs rebuild

test:
	pnpm tsx --test 'src/**/*.test.ts'

clean:
	rm -Rf mjs

build-mjs:
	node ../../scripts/build-package.mjs

build: build-mjs

rebuild: clean build

.PHONY: test

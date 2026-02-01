clean:
	rm -Rf cjs mjs test/*.js

build-cjs:
	rm -Rf cjs
	pnpm tsc -m commonjs -d --outDir cjs
	echo '{"type":"commonjs"}' > cjs/package.json

build-mjs:
	rm -Rf mjs
	pnpm tsc -d --outDir mjs

build: build-cjs build-mjs

rebuild: clean build

test:
	NODE_OPTIONS="--no-warnings --experimental-vm-modules" pnpm jest

update:
	pnpm npm-check --update --save-exact

preversion: rebuild test

postversion:
	git push
	git push --tags
	pnpm publish --access public

.PHONY: test

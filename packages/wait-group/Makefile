test: rebuild
	node --test cjs

clean:
	rm -Rf cjs mjs test/*.js

build-cjs:
	rm -Rf cjs
	./node_modules/.bin/tsc -m commonjs -t es2022 -d --sourceMap --outDir cjs
	echo '{"type":"commonjs"}' > cjs/package.json

build-mjs:
	rm -Rf mjs
	./node_modules/.bin/tsc -d -t es2022 --sourceMap --outDir mjs

build: build-cjs build-mjs

rebuild: clean build

update:
	npx npm-check --update --save-exact

postversion:
	git push
	git push --tags
	npm publish --access public

install:
	pnpm i

ci: install test

.PHONY: test

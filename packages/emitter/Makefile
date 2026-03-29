clean:
	@rm -Rf cjs mjs test/*.js

build-cjs:
	@rm -Rf cjs
	@npx tsc -m commonjs -d --outDir cjs
	@echo '{"type":"commonjs"}' > cjs/package.json

build-mjs:
	@rm -Rf mjs
	@npx tsc -d --outDir mjs

build: build-cjs build-mjs

rebuild: clean build

test: rebuild
	npx tsx --test src/**/*.test.ts

update:
	@npx npm-check --update --save-exact

postversion:
	@git push
	@git push --tags
	@npm publish --access public

.PHONY: test

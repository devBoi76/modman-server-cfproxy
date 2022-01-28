build: src/*
	tsc -p tsconfig.json

run: build
	nodejs out/main.js

clean: out/*
	rm out/*
	rm -rf assets

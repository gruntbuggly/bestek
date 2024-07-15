
LIB := $(wildcard lib/*.js)

build: $(LIB) index.html app.js
	mkdir -p build/
	cp -r lib/ build/lib/
	cp index.html app.js build/

bestek-%.zip: build
	cp -r build/ bestek-$*/
	zip $@ -r bestek-$*/
	rm -rf bestek-$*/

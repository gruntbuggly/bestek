
LIB := $(wildcard lib/*.js)

build: $(LIB) index.html app.js tailwind.config.js
	mkdir -p build/
	cp -r lib/ build/lib/
	cp index.html app.js tailwind.config.js build/

bestek-%.zip: build
	cp -r build/ bestek-$*/
	zip $@ -r bestek-$*/
	rm -rf bestek-$*/

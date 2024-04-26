
LIB := $(wildcard lib/*.js)

build: $(LIB) index.html style.css app.js
	mkdir -p build/
	cp -r lib/ build/lib/
	cp index.html style.css app.js build/

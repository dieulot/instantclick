all:
	@mkdir -p build
	@head -1 src/instantclick.js > build/min.head.js
	@cat src/instantclick.js src/loading-indicator.js > build/cat.js
	@curl --silent --data "output_info=compiled_code" --data-urlencode "js_code@build/cat.js" "http://closure-compiler.appspot.com/compile" -o build/min.code.js
	@cat build/min.head.js build/min.code.js > build/instantclick.min.js
	@rm build/cat.js build/min.head.js build/min.code.js
	@gzip build/instantclick.min.js
	@du -b build/instantclick.min.js.gz
	@gunzip build/instantclick.min.js.gz

clean:
	@rm -r build

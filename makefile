all:
	@head -1 instantclick.js > head.js
	@curl --silent --data "output_info=compiled_code" --data-urlencode "js_code@instantclick.js" "http://closure-compiler.appspot.com/compile" -o min.js
	@cat head.js min.js > instantclick.min.js
	@gzip instantclick.min.js
	@du -b instantclick.js instantclick.min.js.gz
	@rm min.js head.js
	@gunzip instantclick.min.js.gz

clean:
	@rm instantclick.min.js

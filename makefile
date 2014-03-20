all:
	@head -1 instantclick.js > min.head.js
	@curl --silent --data "output_info=compiled_code" --data-urlencode "js_code@instantclick.js" "http://closure-compiler.appspot.com/compile" -o min.code.js
	@cat min.head.js min.code.js > instantclick.min.js
	@rm min.head.js min.code.js
	@gzip instantclick.min.js
	@du -b instantclick.js instantclick.min.js.gz
	@gunzip instantclick.min.js.gz

clean:
	@rm instantclick.min.js

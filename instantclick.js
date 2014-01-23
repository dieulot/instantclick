// InstantClick 1.1
// (C) 2014 Alexandre Dieulot
// http://instantclick.io/license.html

var InstantClick = function(document, location) {
	var currentLocationWithoutHash
	var pHistory = {} // short for "preloadHistory"
	var p = {} // short for "preloads"
	var supported = 'pushState' in history
	var useBlacklist
	var listeners = {change: []}

	function removeHash(url) {
		var index = url.indexOf('#')
		if (index == -1) {
			return url
		}
		return url.substr(0, index)
	}

	function getLinkTarget(target) {
		while (target.nodeName != 'A') {
			target = target.parentNode
		}
		return target
	}

	function on(type, listener) {
		listeners[type].push(listener)
	}

	function triggerPageEvent(type) {
		for (var i = 0; i < listeners[type].length; i++) {
			listeners[type][i]()
		}
	}

	function debug() {
		return {
			currentLocationWithoutHash: currentLocationWithoutHash,
			p: p,
			pHistory: pHistory,
			supported: supported,
			useBlacklist: useBlacklist
		}
	}

	function instantanize(isInitializing) {
		var as = document.getElementsByTagName('a'), a, domain = location.protocol + '//' + location.host
		for (var i = as.length - 1; i >= 0; i--) {
			a = as[i]
			if (a.target || // target="_blank" etc.
				a.href.indexOf(domain + '/') != 0 || // another domain
				a.href.indexOf('#') > -1 && removeHash(a.href) == currentLocationWithoutHash || // link to an anchor
				(useBlacklist ? a.hasAttribute('data-no-instant') : !a.hasAttribute('data-instant'))) {
				continue
			}
			a.addEventListener('mouseover', queue)
			a.addEventListener('click', click)
		}
		if (!isInitializing) {
			var scripts = document.getElementsByTagName('script'), script, copy, parentNode, nextSibling
			for (i = 0, j = scripts.length; i < j; i++) {
				script = scripts[i]
				if (script.hasAttribute('data-no-instant')) {
					continue
				}
				copy = document.createElement('script')
				if (script.src) {
					copy.src = script.src
				}
				if (script.innerHTML) {
					copy.innerHTML = script.innerHTML
				}
				parentNode = script.parentNode
				nextSibling = script.nextSibling
				parentNode.removeChild(script)
				parentNode.insertBefore(copy, nextSibling)
			}
		}
		triggerPageEvent('change')
	}

	function queue(e) {
		var a = getLinkTarget(e.target)
		a.addEventListener('mouseout', mouseout)
		preload(a.href)
	}

	function preload(url) {
		if (p.state == 'waiting') {
			/* A link has been clicked but has not yet been displayed,
			   we don't preload another one. */

			return
		}
		if (p.state == 'preloading' && url == p.url) {
			/* The same link is already preloading. */

			return
		}
		p.state = 'preloading'
		p.url = url
		p.body = false
		p.hasBody = true
		p.timingStart = +new Date
		p.timing = false
		p.xhr.open('GET', url)
		p.xhr.send()
	}

	function readystatechange(e) {
		if (p.xhr.readyState < 4) {
			return
		}

		var text = p.xhr.responseText

		p.timing = +new Date - p.timingStart
		// Note: For debugging (`InstantClick.debug`), we know the page
		// has been preloaded if `p.timing` isn't false.

		var titleIndex = text.indexOf('<title')
		if (titleIndex > -1) {
			p.title = text.substr(text.indexOf('>', titleIndex) + 1)
			p.title = p.title.substr(0, p.title.indexOf('</title'))
		}

		var bodyIndex = text.indexOf('<body')
		if (bodyIndex > -1) {
			p.body = text.substr(text.indexOf('>', bodyIndex) + 1)
			var closingIndex = p.body.indexOf('</body')
			if (closingIndex > -1) {
				p.body = p.body.substr(0, closingIndex)
			}

			var urlWithoutHash = removeHash(p.url)
			pHistory[urlWithoutHash] = {
				body: p.body,
				title: p.title,
				scrollY: urlWithoutHash in pHistory ? pHistory[urlWithoutHash].scrollY : 0
			}
		}
		else {
			p.hasBody = false
		}
		/* We're only getting the body element's innerHTML, not the
		   element's attributes such as class etc.
		   From a superficial look into it, it seems Turbolinks DOMify
		   the body element so it's able to also get classes etc., and
		   doesn't require an explicit body tag in the html. This
		   should be explored later. */

		if (p.state == 'waiting') {
			display(p.url)
		}
	}

	function click(e) {
		if (e.which > 1 || e.metaKey || e.ctrlKey) { // Opening in new tab
			return
		}
		e.preventDefault()
		display(getLinkTarget(e.target).href)
	}

	function display(url) {
		if (p.state != 'preloading') {
			/* If the state is '' or 'displayed', the page hasn't been
			   preloaded. This happens if the user has focused on a link (with
			   his Tab key) and then pressed Return, which triggered a click.
			   Because very few people do this, it isn't worth handling this
			   case and preloading on focus (also, focussing on a link
			   doesn't mean it's likely that you'll "click" on it), so we just
			   redirect them when they "click".

			   If the state is 'waiting', the user clicked twice on a link
			   while this link wasn't ready.
			   Two possibility:
			   1) He clicks on the same link again, either because it's slow
			      to load (there's no browser loading indicator with
			      InstantClick, so he might think his click hasn't registered
			      if the page isn't loading fast enough) or because he has
			      a habit of double clicking, and does it on the web;
			   2) He clicks on another link.

			   In the first case, we redirect him (send him to the page the old
			   way) so that he can have the browser's loading indicator back.
			   In the second case, we redirect him because we haven't preloaded
			   that link, as we were already preloading the last one.

			   Determining if it's a double click might be overkill as there is
			   (hopefully) not that many people that double click on the web.
			   Fighting against the perception that the page is stuck is
			   interesting though, a seemingly good way to do that would be to
			   later incorporate a progress bar.
			*/

			location.href = url
			return
		}
		if (!p.body) {
			if (!p.hasBody) {
				location.href = p.url
				return
			}
			p.state = 'waiting'
			return
		}
		pHistory[currentLocationWithoutHash].scrollY = scrollY
		p.state = 'displayed'
		document.body.innerHTML = p.body
		document.title = p.title
		var hashIndex = p.url.indexOf('#')
		var hashElem = hashIndex > -1 && document.getElementById(p.url.substr(hashIndex + 1))
		var offset = 0
		if (p.url != location.href && hashElem) {
			for (; hashElem.offsetParent; hashElem = hashElem.offsetParent) {
				offset += hashElem.offsetTop
			}
		}
		scrollTo(0, offset)
		history.pushState(null, null, p.url)
		currentLocationWithoutHash = removeHash(location.href)
		instantanize()
	}

	function mouseout(e) {
		var target = getLinkTarget(e.target)
		if (p.state != 'preloading') { // User has clicked the link
			return
		}
		p.xhr.abort()
		p.state = ''
	}

	function init(arg_useBlacklist) {
		if (!supported) {
			triggerPageEvent('change')
			return
		}
		if (p.length) { // Already initialized
			return
		}
		useBlacklist = !!arg_useBlacklist
		currentLocationWithoutHash = removeHash(location.href)
		pHistory[currentLocationWithoutHash] = {
			body: document.body.innerHTML,
			title: document.title,
			scrollY: scrollY
		}
		p.xhr = new XMLHttpRequest()
		p.xhr.addEventListener('readystatechange', readystatechange)
		p.url = false
		p.body = false
		p.hasBody = true
		p.title = false
		p.state = ''
		p.timingStart = false
		p.timing = false
		instantanize(true)

		addEventListener('popstate', function() {
			var loc = removeHash(location.href)
			if (loc == currentLocationWithoutHash) {
				return
			}
			if (!(loc in pHistory)) {
				location.href = location.href // Reloads the page and makes use of cache for assets, unlike location.reload()
				return
			}
			pHistory[currentLocationWithoutHash].scrollY = scrollY

			currentLocationWithoutHash = loc
			document.body.innerHTML = pHistory[loc].body
			scrollTo(0, pHistory[loc].scrollY)
			document.title = pHistory[loc].title
			instantanize()
		})
	}

	return {
		init: init,
		supported: supported,
		on: on,
		debug: debug
	}
}(document, location);

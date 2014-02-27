/* InstantClick 2.1 | (C) 2014 Alexandre Dieulot | http://instantclick.io/license.html */

var InstantClick = function(document, location) {
  // Internal variables
  var $ua = navigator.userAgent,
      $currentLocationWithoutHash,
      $urlToPreload,
      $preloadTimer,

  // Preloading-related variables
      $history = {},
      $xhr,
      $url = false,
      $title = false,
      $hasBody = true,
      $body = false,
      $timing = {},
      $isPreloading = false,
      $isWaitingForCompletion = false,

  // Variables defined by public functions
      $useWhitelist,
      $preloadOnMousedown,
      $delayBeforePreload,
      $eventsCallbacks = {
        change: [],
        click: []
      }


  ////////// HELPERS //////////


  function removeHash(url) {
    var index = url.indexOf('#')
    if (index < 0) {
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

  function triggerPageEvent(eventType, arg1) {
    for (var i = 0; i < $eventsCallbacks[eventType].length; i++) {
      $eventsCallbacks[eventType][i](arg1)
    }

    /* The `change` event takes one boolean argument: "isInitialLoad" */
  }

  function changePage(title, body, newUrl, scrollY) {
    document.title = title

    document.documentElement.replaceChild(body, document.body)
    /* We cannot just use `document.body = doc.body`, it causes Safari (tested
       5.1, 6.0 and Mobile 7.0) to execute script tags directly.
    */

    if (newUrl) {
      history.pushState(null, null, newUrl)

      var hashIndex = newUrl.indexOf('#'),
          hashElem = hashIndex > -1
                     && document.getElementById(newUrl.substr(hashIndex + 1)),
          offset = 0

      if (hashElem) {
        while (hashElem.offsetParent) {
          offset += hashElem.offsetTop

          hashElem = hashElem.offsetParent
        }
      }
      scrollTo(0, offset)

      $currentLocationWithoutHash = removeHash(newUrl)
    }
    else {
      scrollTo(0, scrollY)
    }

    instantanize()
    bar.done()
    triggerPageEvent('change', false)
  }

  function setPreloadingAsHalted() {
    $isPreloading = false
    $isWaitingForCompletion = false
  }


  ////////// EVENT HANDLERS //////////


  function mousedown(e) {
    preload(getLinkTarget(e.target).href)
  }

  function mouseover(e) {
    var a = getLinkTarget(e.target)
    a.addEventListener('mouseout', mouseout)

    if (!$delayBeforePreload) {
      preload(a.href)
    }
    else {
      $urlToPreload = a.href
      $preloadTimer = setTimeout(preload, $delayBeforePreload)
    }
  }

  function click(e) {
    if (e.which > 1 || e.metaKey || e.ctrlKey) { // Opening in new tab
      return
    }
    e.preventDefault()
    triggerPageEvent('click')
    display(getLinkTarget(e.target).href)
  }

  function mouseout() {
    if ($preloadTimer) {
      clearTimeout($preloadTimer)
      $preloadTimer = false
      return
    }

    if (!$isPreloading || $isWaitingForCompletion) {
      return
    }
    $xhr.abort()
    setPreloadingAsHalted()
  }

  function readystatechange() {
    if ($xhr.readyState < 4) {
      return
    }
    if ($xhr.status == 0) {
      /* Request aborted */
      return
    }

    $timing.ready = +new Date - $timing.start

    if ($xhr.getResponseHeader('Content-Type').match(/\/(x|ht)ml/)) {
      var doc = document.implementation.createHTMLDocument('')
      doc.documentElement.innerHTML = $xhr.responseText
      $title = doc.title
      $body = doc.body
      var urlWithoutHash = removeHash($url)
      $history[urlWithoutHash] = {
        body: $body,
        title: $title,
        scrollY: urlWithoutHash in $history ? $history[urlWithoutHash].scrollY : 0
      }
    }
    else {
      $hasBody = false
    }

    if ($isWaitingForCompletion) {
      $isWaitingForCompletion = false
      display($url)
    }
  }


  ////////// MAIN FUNCTIONS //////////


  function instantanize(isInitializing) {
    var as = document.getElementsByTagName('a'),
        a,
        domain = location.protocol + '//' + location.host

    for (var i = as.length - 1; i >= 0; i--) {
      a = as[i]
      if (a.target // target="_blank" etc.
          || a.hasAttribute('download')
          || a.href.indexOf(domain + '/') != 0 // Another domain, or no href
                                               // attribute
          || (a.href.indexOf('#') > -1
              && removeHash(a.href) == $currentLocationWithoutHash) // Anchor
          || ($useWhitelist
              ? !a.hasAttribute('data-instant')
              : a.hasAttribute('data-no-instant'))
         ) {
        continue
      }
      if ($preloadOnMousedown) {
        a.addEventListener('mousedown', mousedown)
      }
      else {
        a.addEventListener('mouseover', mouseover)
      }
      a.addEventListener('click', click)
    }
    if (!isInitializing) {
      var scripts = document.getElementsByTagName('script'),
          script,
          copy,
          parentNode,
          nextSibling

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
  }

  function preload(url) {
    if (!$preloadOnMousedown
        && 'display' in $timing
        && +new Date - ($timing.start + $timing.display) < 100) {
      /* After a page is displayed, if the user's cursor happens to be above
         a link a mouseover event will be in most browsers triggered
         automatically, and in other browsers it will be triggered when the
         user moves his mouse by 1px.

         Here are the behavior I noticed, all on Windows:
         - Safari 5.1: auto-triggers after 0 ms
         - IE 11: auto-triggers after 30-80 ms (depends on page's size?)
         - Firefox: auto-triggers after 10 ms
         - Opera 18: auto-triggers after 10 ms

         - Chrome: triggers when cursor moved
         - Opera 12.16: triggers when cursor moved

         To remedy to this, we do not start preloading if last display
         occurred less than 100 ms ago. If they happen to click on the link,
         they will be redirected.
      */

      return
    }
    if ($preloadTimer) {
      clearTimeout($preloadTimer)
      $preloadTimer = false
    }

    if (!url) {
      url = $urlToPreload
    }

    if ($isPreloading && (url == $url || $isWaitingForCompletion)) {
      return
    }
    $isPreloading = true
    $isWaitingForCompletion = false

    $url = url
    $body = false
    $hasBody = true
    $timing = {
      start: +new Date
    }
    $xhr.open('GET', url)
    $xhr.send()
  }

  function display(url) {
    if (!('display' in $timing)) {
      $timing.display = +new Date - $timing.start
    }
    if ($preloadTimer) {
      /* Happens when there’s a delay before preloading and that delay
         hasn't expired (preloading didn't kick in).
      */

      if ($url && $url != url) {
        /* Happens when the user clicks on a link before preloading
           kicks in while another link is already preloading.
        */

        location.href = url
        return
      }
      preload(url)
      bar.start(0, true)
      $isWaitingForCompletion = true
      return
    }
    if (!$isPreloading || $isWaitingForCompletion) {
      /* If the page isn't preloaded, it likely means the user has focused
         on a link (with his Tab key) and then pressed Return, which
         triggered a click.
         Because very few people do this, it isn't worth handling this case
         and preloading on focus (also, focusing on a link doesn't mean it's
         likely that you'll "click" on it), so we just redirect them when
         they "click".
         It could also mean the user hovered over a link less than 100 ms
         after a page display, thus we didn't start the preload (see
         comments in `preload()` for the rationale behind this.)

         If the page is waiting for completion, the user clicked twice while
         the page was preloading.
         Two possibilities:
         1) He clicks on the same link again, either because it's slow to
            load (there's no browser loading indicator with InstantClick,
            so he might think his click hasn't registered if the page
            isn't loading fast enough) or because he has a habit of
            double clicking on the web
         2) He clicks on another link

         In the first case, we redirect him (send him to the page the old
         way) so that he can have the browser's loading indicator back.
         In the second case, we redirect him because we haven't preloaded
         that link, since we were already preloading the last one.

         Determining if it's a double click might be overkill as there is
         (hopefully) not that many people that double click on the web.
         Fighting against the perception that the page is stuck is
         interesting though, a seemingly good way to do that would be to
         later incorporate a progress bar.
      */

      location.href = url
      return
    }
    if (!$hasBody) {
      location.href = $url
      return
    }
    if (!$body) {
      bar.start(0, true)
      $isWaitingForCompletion = true
      return
    }
    $history[$currentLocationWithoutHash].scrollY = pageYOffset
    setPreloadingAsHalted()
    changePage($title, $body, $url)
  }


  ////////// PROGRESS BAR FUNCTIONS //////////


  var bar = function() {
    var $barContainer,
        $barElement,
        $barTransformProperty,
        $barProgress,
        $barTimer

    function init() {
      $barContainer = document.createElement('div')
      $barContainer.id = 'instantclick'
      $barElement = document.createElement('div')
      $barElement.id = 'instantclick-bar'
      $barElement.className = 'instantclick-bar'
      $barContainer.appendChild($barElement)

      var vendors = ['Webkit', 'Moz', 'O']

      $barTransformProperty = 'transform'
      if (!($barTransformProperty in $barElement.style)) {
        for (var i = 0; i < 3; i++) {
          if (vendors[i] + 'Transform' in $barElement.style) {
            $barTransformProperty = vendors[i] + 'Transform'
          }
        }
      }

      var transitionProperty = 'transition'
      if (!(transitionProperty in $barElement.style)) {
        for (var i = 0; i < 3; i++) {
          if (vendors[i] + 'Transition' in $barElement.style) {
            transitionProperty = '-' + vendors[i].toLowerCase() + '-' + transitionProperty
          }
        }
      }

      var style = document.createElement('style')
      style.innerHTML = '#instantclick{position:absolute;top:0;left:0;width:100%;pointer-events:none;z-index:3000;' + transitionProperty + ':opacity .25s .1s}'
        + '.instantclick-bar{background:#29f;width:100%;margin-left:-100%;height:3px;' + transitionProperty + ':all .25s}'
      /* We set the bar's background in `.instantclick-bar` so that it can be
         overriden in CSS with `#instantclick-bar`, as IDs have higher priority.
      */
      document.head.appendChild(style)

      if ('orientation' in window) {
        updatePositionAndScale()
        addEventListener('resize', updatePositionAndScale)
        addEventListener('scroll', updatePositionAndScale)
      }

    }

    function start(at, jump) {
      $barProgress = at
      if (document.getElementById($barContainer.id)) {
        document.body.removeChild($barContainer)
      }
      $barContainer.style.opacity = '1'
      if (document.getElementById($barContainer.id)) {
        document.body.removeChild($barContainer)
        /* So there's no CSS animation if already done once and it goes from 1 to 0 */
      }
      update()
      if (jump) {
        setTimeout(jumpStart, 0)
      /* Must be done in a timer, otherwise the CSS animation doesn't happen. */
      }
      clearTimeout($barTimer)
      $barTimer = setTimeout(inc, 500)
    }

    function jumpStart() {
      $barProgress = 10
      update()
    }

    function inc() {
      $barProgress += 1 + (Math.random() * 2)
      if ($barProgress >= 98) {
        $barProgress = 98
      }
      else {
        $barTimer = setTimeout(inc, 500)
      }
      update()
    }

    function update() {
      $barElement.style[$barTransformProperty] = 'translate(' + $barProgress + '%)'
      if (!document.getElementById($barContainer.id)) {
        document.body.appendChild($barContainer)
      }
    }

    function done() {
      if (document.getElementById($barContainer.id)) {
        clearTimeout($barTimer)
        $barProgress = 100
        update()
        $barContainer.style.opacity = '0'
        /* If you're debugging, setting this to 0.5 is handy. */
        return
      }

      /* The bar container hasn't been appended: It's a new page. */
      start($barProgress == 100 ? 0 : $barProgress)
      /* $barProgress is 100 on popstate, usually. */
      setTimeout(done, 0)
      /* Must be done in a timer, otherwise the CSS animation doesn't happen. */
    }

    function updatePositionAndScale() {
      $barContainer.style.left = pageXOffset + 'px'
      $barContainer.style.width = innerWidth + 'px'
      $barContainer.style.top = pageYOffset + 'px'
      $barContainer.style[$barTransformProperty] = 'scaleY(' + (innerWidth / screen[Math.abs(orientation) == 90 ? 'height' : 'width'])  + ')'
    }

    return {
      init: init,
      start: start,
      done: done
    }
  }()


  ////////// PUBLIC VARIABLE AND FUNCTIONS //////////


  var supported = !!(
    'pushState' in history && (
      !$ua.match('Android') ||
      $ua.match('Chrome/')
    )
  )
  /* The state of Android's AOSP browsers:

     2.3.7: pushState appears to work correctly, but
            `doc.documentElement.innerHTML = body` is buggy.
            See details here: http://stackoverflow.com/q/21918564

     3.0:   pushState appears to work correctly (though the URL bar is only
            updated on focus), but
            `document.documentElement.replaceChild(doc.body, document.body)`
        throws DOMException: WRONG_DOCUMENT_ERR.

     4.0.2: Doesn't support pushState.

     4.0.4,
     4.1.1,
     4.2,
     4.3:   pushState is here, but it doesn't update the URL bar.
            (Great logic there.)

     4.4:   Works correctly. Claims to be 'Chrome/30.0.0.0'.

     All androids tested with Android SDK's Emulator.
     Version numbers are from the browser's user agent.

     Because of this mess, the only whitelisted browser on Android is Chrome.
  */

  function init() {
    if ($currentLocationWithoutHash) {
      /* Already initialized */
      return
    }
    if (!supported) {
      triggerPageEvent('change', true)
      return
    }
    for (var i = arguments.length - 1; i >= 0; i--) {
      var arg = arguments[i]
      if (arg === true) {
        $useWhitelist = true
      }
      else if (arg == 'mousedown') {
        $preloadOnMousedown = true
      }
      else if (typeof arg == 'number') {
        $delayBeforePreload = arg
      }
    }
    $currentLocationWithoutHash = removeHash(location.href)
    $history[$currentLocationWithoutHash] = {
      body: document.body.outerHTML,
      title: document.title,
      scrollY: pageYOffset
    }
    $xhr = new XMLHttpRequest()
    $xhr.addEventListener('readystatechange', readystatechange)

    instantanize(true)

    bar.init()

    triggerPageEvent('change', true)

    addEventListener('popstate', function() {
      var loc = removeHash(location.href)
      if (loc == $currentLocationWithoutHash) {
        return
      }

      if (!(loc in $history)) {
        location.href = location.href
        /* Reloads the page while using cache for scripts, styles and images,
           unlike `location.reload()` */
        return
      }

      $history[$currentLocationWithoutHash].scrollY = pageYOffset
      $currentLocationWithoutHash = loc
      changePage($history[loc].title, $history[loc].body, false, $history[loc].scrollY)
    })
  }

  function on(eventType, callback) {
    $eventsCallbacks[eventType].push(callback)
  }


  /* The debug function isn't included by default to reduce file size.
     To enable it, add a slash at the beginning of the comment englobing
     the debug function, and uncomment "debug: debug," in the return
     statement below the function. */

  /*
  function debug() {
    return {
      currentLocationWithoutHash: $currentLocationWithoutHash,
      history: $history,
      xhr: $xhr,
      url: $url,
      title: $title,
      hasBody: $hasBody,
      body: $body,
      timing: $timing,
      isPreloading: $isPreloading,
      isWaitingForCompletion: $isWaitingForCompletion
    }
  }
  //*/


  ////////////////////


  return {
    // debug: debug,
    supported: supported,
    init: init,
    on: on
  }

}(document, location);

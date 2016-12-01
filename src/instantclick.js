/* InstantClick 3.1.0 | (C) 2014-2016 Alexandre Dieulot | http://instantclick.io/license */

var instantClick
  , InstantClick = instantClick = function(document, location, $userAgent) {
  // Internal variables
  var $currentLocationWithoutHash
    , $urlToPreload
    , $preloadTimer
    , $lastTouchTimestamp
    , $hasBeenInitialized
    , $touchEndedWithoutClickTimer

  // Preloading-related variables
    , $history = {}
    , $xhr
    , $url = false
    , $title = false
    , $isContentTypeNotHTML
    , $areTrackedAssetsDifferent
    , $body = false
    , $lastDisplayTimestamp = 0
    , $isPreloading = false
    , $isWaitingForCompletion = false
    , $trackedAssets = []

  // Variables defined by public functions
    , $preloadOnMousedown
    , $delayBeforePreload = 65
    , $eventsCallbacks = {
        preload: [],
        receive: [],
        wait: [],
        change: [],
        restore: [],
        exit: []
      }
    , $currentPageTimers = []
    , $currentPageXhrs = []
    , $windowEventListeners = {}


  ////////// HELPERS //////////


  function removeHash(url) {
    var index = url.indexOf('#')
    if (index == -1) {
      return url
    }
    return url.substr(0, index)
  }

  function getParentLinkElement(element) {
    while (element && element.nodeName != 'A') {
      element = element.parentNode
    }
    // `element` will be null if no link element is found
    return element
  }

  function isBlacklisted(element) {
    do {
      if (!element.hasAttribute) { // Parent of <html>
        break
      }
      if (element.hasAttribute('data-instant')) {
        return false
      }
      if (element.hasAttribute('data-no-instant')) {
        return true
      }
    }
    while (element = element.parentNode)
    return false
  }

  function isPreloadable(linkElement) {
    var domain = location.protocol + '//' + location.host

    if (linkElement.target // target="_blank" etc.
        || linkElement.hasAttribute('download')
        || linkElement.href.indexOf(domain + '/') != 0 // Another domain, or no href attribute
        || (linkElement.href.indexOf('#') > -1
            && removeHash(linkElement.href) == $currentLocationWithoutHash) // Anchor
        || isBlacklisted(linkElement)
       ) {
      return false
    }
    return true
  }

  function triggerPageEvent(eventType) {
    var argumentsToApply = Array.prototype.slice.call(arguments, 1)
      , returnValue = false
    for (var i = 0; i < $eventsCallbacks[eventType].length; i++) {
      if (eventType == 'receive') {
        var altered = $eventsCallbacks[eventType][i].apply(window, argumentsToApply)
        if (altered) {
          /* Update arguments for the next iteration of the loop. */
          if ('body' in altered) {
            argumentsToApply[1] = altered.body
          }
          if ('title' in altered) {
            argumentsToApply[2] = altered.title
          }

          returnValue = altered
        }
      }
      else {
        $eventsCallbacks[eventType][i].apply(window, argumentsToApply)
      }
    }
    return returnValue
  }

  function changePage(title, body, urlToPush, scrollPosition) {
    killTrackedCurrentPageStuff()

    document.documentElement.replaceChild(body, document.body)
    /* We cannot just use `document.body = doc.body`, it causes Safari (tested
       5.1, 6.0 and Mobile 7.0) to execute script tags directly.
    */

    document.title = title

    if (urlToPush) {
      addOrRemoveWindowEventListeners('remove')
      if (urlToPush != location.href) {
        history.pushState(null, null, urlToPush)

        if ($userAgent.indexOf(' CriOS/') > -1) {
          /* Chrome for iOS:
           *
           * 1. Removes title in tab on pushState, so it needs to be set after.
           *
           * 2. Will not set the title if it's identical after trimming, so we
           *    add a non-breaking space.
           */
          if (document.title == title) {
            document.title = title + String.fromCharCode(160)
          }
          else {
            document.title = title
          }
        }
      }

      var hashIndex = urlToPush.indexOf('#')
        , offsetElement = hashIndex > -1
                     && document.getElementById(urlToPush.substr(hashIndex + 1))
        , offset = 0

      if (offsetElement) {
        while (offsetElement.offsetParent) {
          offset += offsetElement.offsetTop

          offsetElement = offsetElement.offsetParent
        }
      }
      if ('requestAnimationFrame' in window) {
        /* Safari on macOS doesn't immediately visually change the page on
         * `document.documentElement.replaceChild`, so if `scrollTo` is called
         * without `requestAnimationFrame` it often scrolls before the page
         * is displayed.
         */
        requestAnimationFrame(function() {
          scrollTo(0, offset)
        })
      }
      else {
        scrollTo(0, offset)
        /* Safari on macOS scrolls before the page is visually changed, but
         * adding `requestAnimationFrame` doesn't fix it in this case. */
      }

      $currentLocationWithoutHash = removeHash(urlToPush)
      $windowEventListeners[$currentLocationWithoutHash] = []

      instantanize(false)

      triggerPageEvent('change', false)
    }
    else {
      /* On popstate, browsers scroll by themselves, but at least Firefox
       * scrolls BEFORE popstate is fired and thus before we can replace the
       * page. If the page before popstate is too short the user won't be
       * scrolled at the right position as a result. We need to scroll again.
       */
      scrollTo(0, scrollPosition)

      /* iOS's gesture to go back by swiping from the left edge of the screen
       * will start a preloading if the user touches a link, it needs to be
       * cancelled otherwise the page behind the touched link will be
       * displayed.
       */
      $xhr.abort()
      setPreloadingAsHalted()

      applyScriptElements(function(element) {
        return element.hasAttribute('data-instant-restore')
      })

      triggerPageEvent('restore')
    }
  }

  function setPreloadingAsHalted() {
    $isPreloading = false
    $isWaitingForCompletion = false
  }

  function removeNoscriptTags(html) {
    /* Must be done on text, not on a node's innerHTML, otherwise strange
     * things happen with implicitly closed elements (see the Noscript test).
     */
    return html.replace(/<noscript[\s\S]+?<\/noscript>/gi, '')
  }

  function killTrackedCurrentPageStuff() {
    /* Timers */
    for (var i = 0; i < $currentPageTimers.length; i++) {
      clearTimeout($currentPageTimers[i])
    }
    $currentPageTimers = []

    /* XHRs */
    for (var i = 0; i < $currentPageXhrs.length; i++) {
      if (typeof $currentPageXhrs[i] == 'object' && 'abort' in $currentPageXhrs[i]) {
        $currentPageXhrs[i].instantKilled = true
        $currentPageXhrs[i].abort()
      }
    }
    $currentPageXhrs = []
  }

  function handleTouchendWithoutClick() {
    $xhr.abort()
    setPreloadingAsHalted()
  }

  function addOrRemoveWindowEventListeners(addOrRemove) {
    if ($currentLocationWithoutHash in $windowEventListeners) {
      for (var i = 0; i < $windowEventListeners[$currentLocationWithoutHash].length; i++) {
        window[addOrRemove + 'EventListener'].apply(window, $windowEventListeners[$currentLocationWithoutHash][i])
      }
    }
  }

  function applyScriptElements(condition) {
    var scriptElementsInDOM = document.body.getElementsByTagName('script')
      , scriptElementsToCopy = []
      , originalElement
      , copyElement
      , parentNode
      , nextSibling
      , i

    /* `scriptElementsInDOM` will change during the copy of scripts if
       a script add or delete script elements, so we need to put script
       elements in an array to loop through them correctly.
    */
    for (i = 0; i < scriptElementsInDOM.length; i++) {
      scriptElementsToCopy.push(scriptElementsInDOM[i])
    }

    for (i = 0; i < scriptElementsToCopy.length; i++) {
      originalElement = scriptElementsToCopy[i]
      if (!originalElement) { // Might have disappeared, see previous comment
        continue
      }
      if (!condition(originalElement)) {
        continue
      }

      copyElement = document.createElement('script')
      for (var j = 0; j < originalElement.attributes.length; j++) {
        copyElement.setAttribute(originalElement.attributes[j].name, originalElement.attributes[j].value)
      }
      copyElement.textContent = originalElement.textContent

      parentNode = originalElement.parentNode
      nextSibling = originalElement.nextSibling
      parentNode.removeChild(originalElement)
      parentNode.insertBefore(copyElement, nextSibling)
    }
  }


  ////////// EVENT LISTENERS //////////


  function mousedownListener(event) {
    var linkElement = getParentLinkElement(event.target)

    if (!linkElement || !isPreloadable(linkElement)) {
      return
    }

    preload(linkElement.href)
  }

  function mouseoverListener(event) {
    if ($lastTouchTimestamp > (+new Date - 500)) {
      /* On a touch device, if the content of the page change on mouseover
       * click is never fired and the user will need to tap a second time.
       * https://developer.apple.com/library/content/documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/HandlingEvents.html#//apple_ref/doc/uid/TP40006511-SW4
       *
       * Content change could happen in the `preload` event, so we stop there.
       */
      return
    }

    if (+new Date - $lastDisplayTimestamp < 100) {
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

         To remedy to this, we do nothing if the last display occurred less
         than 100 ms ago.
      */

      return
    }

    var linkElement = getParentLinkElement(event.target)

    if (!linkElement) {
      return
    }

    if (linkElement == getParentLinkElement(event.relatedTarget)) {
      /* Happens when mouseout-ing and mouseover-ing child elements of the same link element */
      return
    }

    if (!isPreloadable(linkElement)) {
      return
    }

    linkElement.addEventListener('mouseout', mouseoutListener)

    if (!$isWaitingForCompletion) {
      $urlToPreload = linkElement.href
      $preloadTimer = setTimeout(preload, $delayBeforePreload)
    }
  }

  function touchstartListener(event) {
    $lastTouchTimestamp = +new Date

    var linkElement = getParentLinkElement(event.target)

    if (!linkElement || !isPreloadable(linkElement)) {
      return
    }

    if ($touchEndedWithoutClickTimer) {
      clearTimeout($touchEndedWithoutClickTimer)
      $touchEndedWithoutClickTimer = false
    }

    linkElement.addEventListener('touchend', touchendAndTouchcancelListener)
    linkElement.addEventListener('touchcancel', touchendAndTouchcancelListener)

    preload(linkElement.href)
  }

  function clickListenerPrelude() {
    /* Makes clickListener be fired after everyone else, so that we can respect
     * event.preventDefault.
     */
    document.body.addEventListener('click', clickListener)
  }

  function clickListener(event) {
    document.body.removeEventListener('click', clickListener)

    if ($touchEndedWithoutClickTimer) {
      clearTimeout($touchEndedWithoutClickTimer)
      $touchEndedWithoutClickTimer = false
    }

    if (event.defaultPrevented) {
      return
    }

    var linkElement = getParentLinkElement(event.target)

    if (!linkElement || !isPreloadable(linkElement)) {
      return
    }

    if (event.which > 1 || event.metaKey || event.ctrlKey) { // Opening in new tab
      return
    }
    event.preventDefault()
    display(linkElement.href)
  }

  function mouseoutListener(event) {
    if (getParentLinkElement(event.target) == getParentLinkElement(event.relatedTarget)) {
      /* Happens when mouseout-ing and mouseover-ing child elements of the same link element,
         we don't want to stop preloading then. */
      return
    }

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

  function touchendAndTouchcancelListener(event) {
    if (!$isPreloading || $isWaitingForCompletion) {
      return
    }

    $touchEndedWithoutClickTimer = setTimeout(handleTouchendWithoutClick, 500)
  }

  function readystatechangeListener() {
    if ($xhr.readyState == 2) { // headers received
      var contentType = $xhr.getResponseHeader('Content-Type')
      if (!contentType || !/^text\/html/i.test(contentType)) {
        $isContentTypeNotHTML = true
      }
    }

    if ($xhr.readyState < 4) {
      return
    }

    if ($xhr.status == 0) {
      /* Request error/timeout/abort */
      $gotANetworkError = true
      if ($isWaitingForCompletion) {
        triggerPageEvent('exit', $url, 'network error')
        location.href = $url
      }
      return
    }

    if ($isContentTypeNotHTML) {
      if ($isWaitingForCompletion) {
        triggerPageEvent('exit', $url, 'non-html content-type')
        location.href = $url
      }
      return
    }

    var doc = document.implementation.createHTMLDocument('')
    doc.documentElement.innerHTML = removeNoscriptTags($xhr.responseText)
    $title = doc.title
    $body = doc.body

    var alteredOnReceive = triggerPageEvent('receive', $url, $body, $title)
    if (alteredOnReceive) {
      if ('body' in alteredOnReceive) {
        $body = alteredOnReceive.body
      }
      if ('title' in alteredOnReceive) {
        $title = alteredOnReceive.title
      }
    }

    var urlWithoutHash = removeHash($url)
    $history[urlWithoutHash] = {
      body: $body,
      title: $title,
      scrollPosition: urlWithoutHash in $history ? $history[urlWithoutHash].scrollPosition : 0
    }

    var elements = doc.head.children
      , found = 0
      , element
      , data

    for (var i = 0; i < elements.length; i++) {
      element = elements[i]
      if (!element.hasAttribute('data-instant-track')) {
        continue
      }
      data = element.getAttribute('href') || element.getAttribute('src') || element.textContent
      for (var j = 0; j < $trackedAssets.length; j++) {
        if ($trackedAssets[j] == data) {
          found++
        }
      }
    }
    if (found != $trackedAssets.length) {
      $areTrackedAssetsDifferent = true
    }

    if ($isWaitingForCompletion) {
      $isWaitingForCompletion = false
      display($url)
    }
  }

  function popstateListener() {
    var loc = removeHash(location.href)
    if (loc == $currentLocationWithoutHash) {
      return
    }

    if ($isWaitingForCompletion) {
      setPreloadingAsHalted()
      $xhr.abort()
    }

    if (!(loc in $history)) {
      triggerPageEvent('exit', location.href, 'not in history')
      if (loc == location.href) { // no location.hash
        location.href = location.href
        /* Reloads the page while using cache for scripts, styles and images,
           unlike `location.reload()` */
      }
      else {
        /* When there's a hash, `location.href = location.href` won't reload
           the page (but will trigger a popstate event, thus causing an infinite
           loop), so we need to call `location.reload()` */
        location.reload()
      }
      return
    }

    $history[$currentLocationWithoutHash].scrollPosition = pageYOffset
    addOrRemoveWindowEventListeners('remove')
    $currentLocationWithoutHash = loc
    changePage($history[loc].title, $history[loc].body, false, $history[loc].scrollPosition)
    addOrRemoveWindowEventListeners('add')
  }


  ////////// MAIN FUNCTIONS //////////


  function instantanize(isInitializing) {
    document.body.addEventListener('touchstart', touchstartListener, true)
    if ($preloadOnMousedown) {
      document.body.addEventListener('mousedown', mousedownListener, true)
    }
    else {
      document.body.addEventListener('mouseover', mouseoverListener, true)
    }
    document.body.addEventListener('click', clickListenerPrelude, true)

    if (!isInitializing) {
      applyScriptElements(function(element) {
        return !element.hasAttribute('data-no-instant')
      })
    }
  }

  function preload(url) {
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
    $isContentTypeNotHTML = false
    $gotANetworkError = false
    $areTrackedAssetsDifferent = false
    triggerPageEvent('preload')
    $xhr.open('GET', url)
    $xhr.timeout = 90000 // Must be set after `open()` with IE
    $xhr.send()
  }

  function display(url) {
    $lastDisplayTimestamp = +new Date
    if ($preloadTimer || !$isPreloading) {
      /* $preloadTimer:
         Happens when there's a delay before preloading and that delay
         hasn't expired (preloading didn't kick in).

         !$isPreloading:
         A link has been clicked, and preloading hasn't been initiated.
         It happens with touch devices when a user taps *near* the link,
         causing `touchstart` not to be fired. Safari/Chrome will trigger
         `mouseover`, `mousedown`, `click` (and others), but when that happens
         we do nothing in `mouseover` as it may cause `click` not to fire (see
         comment in `mouseoverListener`).

         It also happens when a user uses his keyboard to navigate (with Tab
         and Return), and possibly in other non-mainstream ways to navigate
         a website.
      */

      if ($preloadTimer && $url && $url != url) {
        /* Happens when the user clicks on a link before preloading
           kicks in while another link is already preloading.
        */

        triggerPageEvent('exit', url, 'click occured while preloading planned')
        location.href = url
        return
      }

      preload(url)
      triggerPageEvent('wait')
      $isWaitingForCompletion = true // Must be set *after* calling `preload`
      return
    }
    if ($isWaitingForCompletion) {
      /* The user clicked on a link while a page to display was preloading.
         Either on the same link or on another link. If it's the same link
         something might have gone wrong (or he could have double clicked, we
         don't handle that case), so we send him to the page without pjax.
         If it's another link, it hasn't been preloaded, so we redirect the
         user to it.
      */
      triggerPageEvent('exit', url, 'clicked on a link while waiting for another page to display')
      location.href = url
      return
    }
    if ($isContentTypeNotHTML) {
      triggerPageEvent('exit', $url, 'non-html content-type')
      location.href = $url
      return
    }
    if ($gotANetworkError) {
      triggerPageEvent('exit', $url, 'network error')
      location.href = $url
      return
    }
    if ($areTrackedAssetsDifferent) {
      triggerPageEvent('exit', $url, 'different assets')
      location.href = $url
      return
    }
    if (!$body) {
      triggerPageEvent('wait')
      $isWaitingForCompletion = true
      return
    }
    $history[$currentLocationWithoutHash].scrollPosition = pageYOffset
    setPreloadingAsHalted()
    changePage($title, $body, $url)
  }


  ////////// PUBLIC VARIABLE AND FUNCTIONS //////////

  var supported = false
  if ('pushState' in history
      && location.protocol != "file:") {
    supported = true

    var indexOfAndroid = $userAgent.indexOf('Android ')
    if (indexOfAndroid > -1) {
      /* The stock browser in Android 4.0.3 through 4.3.1 supports pushState,
         though it doesn't update the address bar.

         More problematic is that it has a bug on `popstate` when coming back
         from a page not displayed through InstantClick: `location.href` is
         undefined and `location.reload()` doesn't work.

         Android < 4.4 is therefore blacklisted, unless it's a browser known
         not to have that latter bug.
      */

      var androidVersion = parseFloat($userAgent.substr(indexOfAndroid + 'Android '.length))
      if (androidVersion < 4.4) {
        supported = false
        if (androidVersion >= 4) {
          var whitelistedBrowsersUserAgentsOnAndroid4 = [
            / Chrome\//, // Chrome, Opera, Puffin, QQ, Yandex
            / UCBrowser\//,
            / Firefox\//,
            / Windows Phone /, // WP 8.1+ pretends to be Android
          ]
          for (var i = 0; i < whitelistedBrowsersUserAgentsOnAndroid4.length; i++) {
            if (whitelistedBrowsersUserAgentsOnAndroid4[i].test($userAgent)) {
              supported = true
              break
            }
          }
        }
      }
    }
  }

  function init(preloadingMode) {
    if (!supported) {
      triggerPageEvent('change', true)
      return
    }

    if ($hasBeenInitialized) {
      return
    }
    $hasBeenInitialized = true

    if (preloadingMode == 'mousedown') {
      $preloadOnMousedown = true
    }
    else if (typeof preloadingMode == 'number') {
      $delayBeforePreload = preloadingMode
    }

    $currentLocationWithoutHash = removeHash(location.href)
    $history[$currentLocationWithoutHash] = {
      body: document.body,
      title: document.title,
      scrollPosition: pageYOffset
    }

    var elements = document.head.children
      , element
      , data
    for (var i = 0; i < elements.length; i++) {
      element = elements[i]
      if (element.hasAttribute('data-instant-track')) {
        data = element.getAttribute('href') || element.getAttribute('src') || element.textContent
        /* We can't use just `element.href` and `element.src` because we can't
           retrieve `href`s and `src`s from the Ajax response.
        */
        $trackedAssets.push(data)
      }
    }

    $xhr = new XMLHttpRequest()
    $xhr.addEventListener('readystatechange', readystatechangeListener)

    instantanize(true)

    addEventListener('popstate', popstateListener)
  }

  function on(eventType, callback) {
    $eventsCallbacks[eventType].push(callback)

    if (eventType == 'change') {
      callback(!$lastDisplayTimestamp)
    }
  }

  function setTimeout() {
    var timer = window.setTimeout.apply(window, arguments)
    $currentPageTimers.push(timer)
    return timer
  }

  function setInterval() {
    var timer = window.setInterval.apply(window, arguments)
    $currentPageTimers.push(timer)
    return timer
  }

  function xhr(xhr) {
    if (!xhr) {
      xhr = new XMLHttpRequest()
    }
    $currentPageXhrs.push(xhr)
    return xhr
  }

  function _addEventListener() {
    if (!($currentLocationWithoutHash in $windowEventListeners)) {
      $windowEventListeners[$currentLocationWithoutHash] = []
    }
    $windowEventListeners[$currentLocationWithoutHash].push(arguments)
    addEventListener.apply(window, arguments)
  }


  ////////////////////


  return {
    supported: supported,
    init: init,
    on: on,
    setTimeout: setTimeout,
    setInterval: setInterval,
    xhr: xhr,
    addEventListener: _addEventListener
  }

}(document, location, navigator.userAgent);

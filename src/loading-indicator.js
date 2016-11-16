/* InstantClick's loading indicator | (C) 2014-2016 Alexandre Dieulot | http://instantclick.io/license */

;(function() {
  var $element
    , $timer

  function init() {
    $element = document.createElement('div')
    $element.id = 'instantclick'

    var vendors = {
          Webkit: true,
          Moz: true
        }
      , vendorPrefix = ''

    if (!('transform' in $element.style)) {
      for (var vendor in vendors) {
        if (vendor + 'Transform' in $element.style) {
          vendorPrefix = '-' + vendor.toLowerCase() + '-'
        }
      }
    }

    var styleElement = document.createElement('style')
    styleElement.setAttribute('instantclick', '') // So that this style element doesn't surprise developers in the browser DOM inspector.
    styleElement.textContent = '#instantclick {pointer-events:none; z-index:2147483647; position:fixed; top:0; left:0; width:100%; height:3px; border-radius:2px; color:hsl(192,100%,50%); background:currentColor; box-shadow: 0 -1px 8px; opacity: 0;}' +
                               '#instantclick.visible {opacity:1; ' + vendorPrefix + 'animation:instantclick .6s linear infinite;}' +
                               '@' + vendorPrefix + 'keyframes instantclick {0%,5% {' + vendorPrefix + 'transform:translateX(-100%);} 45%,55% {' + vendorPrefix + 'transform:translateX(0%);} 95%,100% {' + vendorPrefix + 'transform:translateX(100%);}}'
    document.head.appendChild(styleElement)
  }

  function changeListener(isInitialPage) {
    if (!instantClick.supported) {
      return
    }

    if (isInitialPage) {
      init()
    }

    document.body.appendChild($element)

    if (!isInitialPage) {
      hide()
    }
  }

  function waitListener() {
    $timer = instantClick.setTimeout(show, 800)
  }

  function show() {
    $element.className = 'visible'
  }

  function hide() {
    clearTimeout($timer)

    $element.className = ''
    /* Doesn't work (has no visible effect) in Safari on `exit`.
     *
     * My guess is that Safari queues styling change for the next frame and
     * drops that queue on location change.
     */
  }


  ////////////////////


  instantClick.on('change', changeListener)
  instantClick.on('wait', waitListener)
  instantClick.on('exit', hide)
  instantClick.on('restore', hide)


  ////////////////////


  instantClick.loadingIndicator = {
    show: show,
    hide: hide
  }
})();

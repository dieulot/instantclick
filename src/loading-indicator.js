/* InstantClick's loading indicator | (C) 2014-2015 Alexandre Dieulot | http://instantclick.io/license */

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
      , vendorsPrefixes = {
          animation: '',
          transform: ''
        }

    function camelCase(str) {
      return str.replace(/^(.)/, function(firstChar) {
        return firstChar.toUpperCase()
      })
    }

    for (var property in vendorsPrefixes) {
      if (!(property in $element.style)) {
        for (var vendor in vendors) {
          if (vendor + camelCase(property) in $element.style) {
            vendorsPrefixes[property] = '-' + vendor.toLowerCase() + '-'
          }
        }
      }
    }

    var styleElement = document.createElement('style')
    styleElement.setAttribute('instantclick', '') // So that this style element doesn't surprise developers in the browser DOM inspector.
    styleElement.innerHTML = '#instantclick {pointer-events:none; z-index:2147483647; position:fixed; top:0; left:0; width:100%; height:3px; border-radius:2px; color:hsl(192,100%,50%); background:currentColor; box-shadow: 0 -1px 4px currentColor; opacity: 0;}' +
                             '#instantclick.visible {opacity:1; ' + vendorsPrefixes.animation + 'animation:instantclick .6s linear infinite;}' +
                             '@' + vendorsPrefixes.animation + 'keyframes instantclick {0%,5% {' + vendorsPrefixes.transform + 'transform:translateX(-100%);} 45%,55% {' + vendorsPrefixes.transform + 'transform:translateX(0%);} 95%,100% {' + vendorsPrefixes.transform + 'transform:translateX(100%);}}'
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
    $element.className = ''
    clearTimeout($timer)
  }


  ////////////////////


  instantClick.on('change', changeListener)
  instantClick.on('wait', waitListener)
  instantClick.on('exit', hide)
  instantClick.on('restore', hide)


  ////////////////////


  instantClick.showLoadingIndicator = show
})();

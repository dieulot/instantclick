/* InstantClick's loading indicator | (C) 2014-2015 Alexandre Dieulot | http://instantclick.io/license */

;(function() {
  var $container
    , $element
    , $transformProperty
    , $progress
    , $timer
    , $hasTouch = 'createTouch' in document

  function init() {
    $container = document.createElement('div')
    $container.id = 'instantclick'
    $element = document.createElement('div')
    $element.id = 'instantclick-bar'
    $container.appendChild($element)

    var vendors = ['Webkit', 'Moz', 'O']

    $transformProperty = 'transform'
    if (!($transformProperty in $element.style)) {
      for (var i = 0; i < vendors.length; i++) {
        if (vendors[i] + 'Transform' in $element.style) {
          $transformProperty = vendors[i] + 'Transform'
        }
      }
    }

    var transitionProperty = 'transition'
    if (!(transitionProperty in $element.style)) {
      for (var i = 0; i < vendors.length; i++) {
        if (vendors[i] + 'Transition' in $element.style) {
          transitionProperty = '-' + vendors[i].toLowerCase() + '-' + transitionProperty
        }
      }
    }

    var styleElement = document.createElement('style')
    styleElement.innerHTML = '#instantclick{color:#29d;position:' + ($hasTouch ? 'absolute' : 'fixed') + ';top:0;left:0;width:100%;pointer-events:none;z-index:2147483647;' + transitionProperty + ":opacity 1s}\n"
      + '#instantclick-bar{background:currentColor;width:100%;margin-left:-100%;height:2px;' + transitionProperty + ':all 1s}'
    document.head.insertBefore(styleElement, document.head.firstChild)

    if ($hasTouch) {
      updatePositionAndScale()
      addEventListener('resize', updatePositionAndScale)
      addEventListener('scroll', updatePositionAndScale)
    }
  }

  function start() {
    $progress = 0
    $container.style.opacity = '0'
    update()
    setTimeout(display, 0) // Done in a timer to do that on next frame, so that the CSS animation happens
    $timer = setTimeout(inc, 500)
  }

  function display() {
    $progress = 10
    $container.style.opacity = '1'
    update()
  }

  function inc() {
    $progress += 1 + (Math.random() * 2)
    if ($progress > 99) {
      $progress = 99
    }
    else {
      $timer = setTimeout(inc, 500)
    }
    update()
  }

  function update() {
    $element.style[$transformProperty] = 'translate(' + $progress + '%)'
    if (!document.getElementById($container.id)) {
      document.body.appendChild($container)
    }
  }

  function done() {
    clearTimeout($timer)
  }

  function remove() {
    if (document.getElementById($container.id)) {
      document.body.removeChild($container)
    }
  }

  function updatePositionAndScale() {
    /* Adapted from code by Sam Stephenson and Mislav Marohnic
       http://signalvnoise.com/posts/2407
    */

    $container.style.left = pageXOffset + 'px'
    $container.style.width = document.body.clientWidth + 'px'
    $container.style.top = pageYOffset + 'px'

    var landscape = 'orientation' in window && Math.abs(orientation) == 90
      , scaleY = innerWidth / screen[landscape ? 'height' : 'width'] * 1.34
    /* We multiply the size by 2 because the progress bar is harder
       to notice on a mobile device.
    */
    $container.style[$transformProperty] = 'scaleY(' + scaleY  + ')'
  }


  ////////////////////


  instantClick.on('change', function(isInitialPage) {
    if (isInitialPage && instantClick.supported) {
      init()
    }
    else if (!isInitialPage) {
      done()
    }
  })

  instantClick.on('wait', start)

  instantClick.on('restore', remove) // Should be removed in a `beforechange` event instead
})();

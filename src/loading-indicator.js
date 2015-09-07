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
    $element.className = 'instantclick-bar'
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

    var style = document.createElement('style')
    style.innerHTML = '#instantclick{position:' + ($hasTouch ? 'absolute' : 'fixed') + ';top:0;left:0;width:100%;pointer-events:none;z-index:2147483647;' + transitionProperty + ':opacity .25s .1s}'
      + '.instantclick-bar{background:#29d;width:100%;margin-left:-100%;height:2px;' + transitionProperty + ':all .25s}'
    /* We set the bar's background in `.instantclick-bar` so that it can be
       overriden in CSS with `#instantclick-bar`, as IDs have higher priority.
    */
    document.head.appendChild(style)

    if ($hasTouch) {
      updatePositionAndScale()
      addEventListener('resize', updatePositionAndScale)
      addEventListener('scroll', updatePositionAndScale)
    }

  }

  function start(at, jump) {
    $progress = at
    if (document.getElementById($container.id)) {
      document.body.removeChild($container)
    }
    $container.style.opacity = '1'
    if (document.getElementById($container.id)) {
      document.body.removeChild($container)
      /* So there's no CSS animation if already done once and it goes from 1 to 0 */
    }
    update()
    if (jump) {
      setTimeout(jumpStart, 0)
      /* Must be done in a timer, otherwise the CSS animation doesn't happen (I don't know why). */
    }
    clearTimeout($timer)
    $timer = setTimeout(inc, 500)
  }

  function jumpStart() {
    $progress = 10
    update()
  }

  function inc() {
    $progress += 1 + (Math.random() * 2)
    if ($progress >= 98) {
      $progress = 98
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
    if (document.getElementById($container.id)) {
      clearTimeout($timer)
      $progress = 100
      update()
      $container.style.opacity = '0'
      /* When you're debugging, setting this to 0.5 is handy. */
      return
    }

    /* The bar container hasn't been appended: It's a new page. */
    start($progress == 100 ? 0 : $progress)
    /* $progress is 100 on popstate, usually. */
    setTimeout(done, 0)
    /* Must be done in a timer, otherwise the CSS animation doesn't happen. */
  }

  function updatePositionAndScale() {
    /* Adapted from code by Sam Stephenson and Mislav Marohnic
       http://signalvnoise.com/posts/2407
    */

    $container.style.left = pageXOffset + 'px'
    $container.style.width = innerWidth + 'px'
    $container.style.top = pageYOffset + 'px'

    var landscape = 'orientation' in window && Math.abs(orientation) == 90
      , scaleY = innerWidth / screen[landscape ? 'height' : 'width'] * 2
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

  instantClick.on('wait', function() {
    start(0, true)
  })
})();

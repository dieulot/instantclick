var bar = function() {
  var $barContainer
    , $barElement
    , $barTransformProperty
    , $barProgress
    , $barTimer
    , $hasTouch = 'createTouch' in document

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
      for (var i = 0; i < vendors.length; i++) {
        if (vendors[i] + 'Transform' in $barElement.style) {
          $barTransformProperty = vendors[i] + 'Transform'
        }
      }
    }

    var transitionProperty = 'transition'
    if (!(transitionProperty in $barElement.style)) {
      for (var i = 0; i < vendors.length; i++) {
        if (vendors[i] + 'Transition' in $barElement.style) {
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
      /* Must be done in a timer, otherwise the CSS animation doesn't happen (I don't know why). */
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
      /* When you're debugging, setting this to 0.5 is handy. */
      return
    }

    /* The bar container hasn't been appended: It's a new page. */
    start($barProgress == 100 ? 0 : $barProgress)
    /* $barProgress is 100 on popstate, usually. */
    setTimeout(done, 0)
    /* Must be done in a timer, otherwise the CSS animation doesn't happen. */
  }

  function updatePositionAndScale() {
    /* Adapted from code by Sam Stephenson and Mislav Marohnic
       http://signalvnoise.com/posts/2407
    */

    $barContainer.style.left = pageXOffset + 'px'
    $barContainer.style.width = innerWidth + 'px'
    $barContainer.style.top = pageYOffset + 'px'

    var landscape = 'orientation' in window && Math.abs(orientation) == 90
      , scaleY = innerWidth / screen[landscape ? 'height' : 'width'] * 2
    /* We multiply the size by 2 because the progress bar is harder
       to notice on a mobile device.
    */
    $barContainer.style[$barTransformProperty] = 'scaleY(' + scaleY  + ')'
  }

  return {
    init: init,
    start: start,
    done: done
  }
}()

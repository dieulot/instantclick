# InstantClick

[InstantClick](http://instantclick.io/) is a JavaScript library that dramatically speeds up your website, making navigation effectively instant in most cases.

## Why

Despite the huge bandwidth increases, websites don’t get much faster. This is because the biggest botteneck in loading web pages is latency.<sup>1</sup>

## How does it work

Latency is inevitable with today’s internet architecture so InstantClick cheats by preloading links you are likely to click on.

Before visitors click on a link, they hover over that link. Between these two events, 200 ms to 300 ms usually pass by ([test yourself here](http://instantclick.io/click-test.html)). InstantClick makes use of that time to preload the page, so that the page is already there when you click.

If you want your website to not be flooded by requests, you can set a delay before preloading starts when users hover a link. [It will still feel instant](http://www.nngroup.com/articles/response-times-3-important-limits/).

If you don’t want any wasted request, you may preload on “mousedown”. This is when you press your mouse button (a click is when you release it).

***

InstantClick uses pushState and Ajax, a combo known as [pjax](https://github.com/defunkt/jquery-pjax).

Ajax brings two nice benefits in and of itself:

* Your browser doesn’t have to throw and recompile scripts and styles on each page change anymore.
* You don’t get a white flash while your browser is waiting for a page to display, making your website *feel* faster.

If your browser doesn’t [support pushState](http://caniuse.com/#search=pushstate), InstantClick fully degrades.

## Getting started

Head to the [Getting started](http://instantclick.io/start.html) page.

## What’s coming next

By decreasing order of priority:

Preloading on “touchstart”, so that mobile devices can preload too.

* Adding a progress bar (in the spirit of [NProgress](http://ricostacruz.com/nprogress/)), for those users that have a slow connection.
* Getting statistics on how much additional load InstantClick puts on a server.

You can follow InstantClick’s news on [Twitter](https://twitter.com/instantclickjs), or participate in InstantClick’s development on [Github](https://github.com/dieulot/instantclick).

## Footnotes

1. Check out [Latency: The New Web Performance Bottleneck](http://www.igvita.com/2012/07/19/latency-the-new-web-performance-bottleneck/) for a good summary about bandwidth vs. latency effects on web pages.
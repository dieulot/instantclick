<?
$pages = [
  'Index page' => '',
  'Page with anchors #1' => 'anchor1',
  'Page with anchors #2' => 'anchor2',
  'Page without title' => 'no-title',
  'Minimal markup' => 'minimal',
  'NProgress' => 'nprogress',
  'Entities in the &#8249;title&rsaquo;' => 'entities',
  'Noscript' => 'noscript',
  'Alter on receive' => 'alter-receive',
];

$page = 'index';
if (isset($_GET['page']) && in_array($_GET['page'], $pages)) {
  $page = $_GET['page'];
}

$delays = [200, 500, 1000, 2000, 10000];

$preload_on = 'hover';
if (isset($_GET['on'])) {
  if ((int)$_GET['on'] != 0) {
    $preload_on = (int)$_GET['on'];
  }
  elseif ($_GET['on'] == 'mousedown') {
    $preload_on = 'mousedown';
  }
}

$nocache = '&amp;nocache=' . microtime(true) * 10000;
$append = '&amp;on=' . $preload_on . $nocache;

if (isset($_GET['wait'])) {
   usleep((int)$_GET['wait'] * 1000);
}
?>
<!doctype html>
<meta charset="utf-8">
<? if ($page != 'no-title'): ?>
<title><? if ($page == 'entities'): ?>
Entities in the &#8249;title&rsaquo;
<? else: ?>
<?= date('H : i : s') ?> . <? printf("%03d", microtime() * 1000) ?>
<? endif ?></title>
<? endif ?>
<link rel="stylesheet" href="style.css?<?= $append ?>">
<meta name="viewport" content="width=600">

<link rel="stylesheet" href="trackme.css?<?= filemtime('trackme.css') ?>" data-instant-track>
<script src="trackme.js?<?= filemtime('trackme.js') ?>" data-instant-track></script>
<style data-instant-track>body { overflow-y: scroll; }</style>
<script data-instant-track>if (window.lol) { lol() }</script>

<? if ($page == 'nprogress'): ?>
<style>#instantclick { display: none; }</style>
<link rel="stylesheet" href="vendors/nprogress/nprogress-0.1.2.css">
<script src="vendors/jquery/jquery-2.1.0.js"></script>
<script src="vendors/nprogress/nprogress-0.1.2.js"></script>
<? endif ?>

<? if ($page == 'minimal'): ?>
<body>Hiya.
<? exit;
endif ?>

<div id="preloading-level">
  <a data-no-instant href="?<?= $nocache ?>" class="<?= $preload_on == 'hover' ? 'selected' : '' ?>">↻ On hover</a>
  <a data-no-instant href="?on=100<?= $nocache ?>" class="<?= $preload_on === (int)$preload_on ? 'selected' : '' ?>">↻ On hover + 100 ms delay</a>
  <a data-no-instant href="?on=mousedown<?= $nocache ?>" class="<?= $preload_on == 'mousedown' ? 'selected' : '' ?>">↻ On mousedown</a>
</div>

<hr>

<table>
  <tr>
    <th>Page</th>
    <th colspan="<?= count($delays) ?>">Delays (in milliseconds)</th>

<? foreach ($pages as $name => $row): ?>
  <tr>
    <td><a href="?<?= ($row != '' ? ('page=' . $row) : '') . $append ?>"><?= $name ?></a>
<? if (in_array($row, [
 'nprogress',
])): ?>
        <a data-no-instant href="?page=<?= $row . $append ?>">↻</a>
<? endif ?>
<? foreach ($delays as $delay): ?>
    <td><a href="?<?= ($row != '' ? ('page=' . $row) : '') . '&amp;wait=' . $delay . $append ?>"><small><?= $delay ?></small></a>
<? endforeach;
endforeach ?>
</table>

<hr>

<? include('pages/' . $page . '.html') ?>

<div id="divDebug"></div>



<script src="instantclick.js.php?<?= $nocache ?>" data-no-instant></script>


<? if ($page == 'nprogress'): ?>
<script data-no-instant>
InstantClick.on('wait', function() {
  NProgress.start()
})

InstantClick.on('change', function(isInitialLoad) {
  if (isInitialLoad) {
    addDebugMessage('NProgress on')
  }
  NProgress.done(!isInitialLoad)
})
</script>
<? endif ?>

<script data-no-instant>
var $debugMessages = ''

function addDebugMessage(message) {
  var divDebug = document.getElementById('divDebug')
  if (!divDebug) {
    return
  }
  $debugMessages = message + '<br>' + (!divDebug.innerHTML && $debugMessages ? '<hr>' : '') + $debugMessages
  divDebug.innerHTML = $debugMessages
}

InstantClick.on('fetch', function() {
  addDebugMessage('<small><small>Event: fetch</small></small>')
})

InstantClick.on('receive', function(url, body, title) {
  if (url.indexOf('#alter') > -1) {
    addDebugMessage('<small><small>Event: receive (altered)</small></small>')
    var elementToAlter = body.querySelector('#to_alter')
    if (elementToAlter) {
      elementToAlter.innerHTML = '<b>Altered!</b>'
    }
    title = '[Altered] ' + title

    return {
      body: body,
      title: title
    }
  }
  addDebugMessage('<small><small>Event: receive</small></small>')
})

InstantClick.on('wait', function() {
  addDebugMessage('Event: wait')
})

InstantClick.on('change', function(isInitialLoad) {
  addDebugMessage('Event: change' + (isInitialLoad ? ' (initial load)' : ''))
})

InstantClick.init(<?
if ($preload_on == 'mousedown') {
  echo "'mousedown'";
}
elseif ((int)$preload_on != 0) {
  echo $preload_on;
}

?>);
</script>
<?php
$pages = array(
  'Index page' => '',
  'First test page' => '1',
  'Second test page' => '2'
);

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
if ($preload_on == 'hover') {
  $append = $nocache;
}
else {
  $append = '&amp;on=' . $preload_on . $nocache;
}

if (isset($_GET['wait'])) {
   usleep((int)$_GET['wait'] * 1000);
}
?>
<!doctype html>
<meta charset="utf-8">
<title><?php echo date('H : i : s') ?> . <?php printf("%03d", microtime() * 1000) ?></title>
<link rel="stylesheet" href="style.css">
<meta name="viewport" content="width=600">
<body>
<div id="preloading-level">
  <a data-no-instant href="?<?php echo $nocache ?>" class="<?php if ($preload_on == 'hover') echo 'selected' ?>">↻ On hover</a>
  <a data-no-instant href="?on=100<?php echo $nocache ?>" class="<?php if ($preload_on === (int)$preload_on) echo 'selected' ?>">↻ On hover + 100 ms delay</a>
  <a data-no-instant href="?on=mousedown<?php echo $nocache ?>" class="<?php if ($preload_on == 'mousedown') echo 'selected' ?>">↻ On mousedown</a>
</div>

<hr>

<?php $cols = array(100, 200, 300, 400, 500, 1000, 1500, 2000) ?>
<table>
  <tr>
    <th>Page</th>
    <th colspan="<?php echo count($cols) ?>">Delays (in milliseconds)</th>

<?php foreach ($pages as $name => $row): ?>
  <tr>
    <td><a href="?<?php echo ($row != '' ? ('page=' . $row) : '') . $append ?>"><?php echo $name ?></a>
<?php foreach ($cols as $col): ?>
    <td><a href="?<?php echo ($row != '' ? ('page=' . $row) : '') . '&amp;wait=' . $col . $append ?>"><small><?php echo $col ?></small></a>
<?php endforeach;
endforeach ?>
</table>

<hr>

<?php include (isset($_GET['page']) && in_array($_GET['page'], $pages) ? $_GET['page'] : 'welcome') . '.html' ?>

<div id="divDebug"></div>

<script src="../instantclick.js" data-no-instant></script>
<script data-no-instant>
var $debugMessages = '';

function addDebugMessage(message) {
  var divDebug = document.getElementById('divDebug')
  $debugMessages = message + '<br>' + (!divDebug.innerHTML && $debugMessages ? '<hr>' : '') + $debugMessages
  divDebug.innerHTML = $debugMessages
}

InstantClick.on('change', function(isInitialLoad) {
  addDebugMessage('Event: change' + (isInitialLoad ? ' (initial load)' : ''))
})

InstantClick.init(<?php
if ($preload_on == 'mousedown') echo "'mousedown'";
elseif ((int)$preload_on != 0) echo $preload_on;
?>);
</script>
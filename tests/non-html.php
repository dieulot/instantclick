<?php
if (isset($_GET['wait'])) {
  usleep((int)$_GET['wait'] * 1000);
}

header('Content-Type: text/plain');
?>
Text file.

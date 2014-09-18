<?php
$file = '../instantclick.js';
if (file_exists('instanclick.js')) {
  $file = 'instantclick.js';
}

header('Content-Type: text/javascript');
echo file_get_contents($file);

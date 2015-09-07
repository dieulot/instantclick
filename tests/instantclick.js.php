<?php
header('Content-Type: text/javascript');
echo file_get_contents('../src/instantclick.js') . file_get_contents('../src/loading-indicator.js');

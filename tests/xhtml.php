<?php
header('Content-Type: application/xml; charset=utf-8'); // Necessary to do “real” XHTML.
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
        "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">

<head>
	<title>An XHTML 1.0 Strict standard template</title>
</head>

<body>

     <textarea />

     <p><a href="xhtml.php">Load via instantclick.</a></p>

     <p>Hovering over the link gives an error. This XHTML business is <a href="https://github.com/dieulot/instantclick/issues/52">madness</a>, so this won’t get fixed.</p>

     <script src="instantclick.js.php" data-no-instant=""></script>
     <script data-no-instant="">InstantClick.init()</script>

</body>
</html>

<?
require("injectUserPath.php");
$path = $_REQUEST['path'];
$jsonData = $_REQUEST['jsonData'];
print($path . " " . $jsonData);
file_put_contents(injectUserPathN($path,4), $jsonData);
?>

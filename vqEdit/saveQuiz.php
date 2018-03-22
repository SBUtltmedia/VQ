<?
require("injectUserPath.php");
$path = $_REQUEST['path'];
$jsonData = $_REQUEST['jsonData'];
$data=json_decode($jsonData);
$data->videoPath =str_replace("/users","",$data->videoPath);
$jsonData= json_encode($data);

print($path . " " . $jsonData);
file_put_contents(injectUserPathN($path,4), $jsonData);
?>

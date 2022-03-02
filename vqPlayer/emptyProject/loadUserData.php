<?php
// Get netID
clearstatcache();
$netID = $_SERVER['cn'];
if ($netID=="") $netID= "japalmeri";
// Make directory for that netID if it does not exist already
$dataPath="./data/" . $netID;
$rawData=file_get_contents($dataPath);
if(!$rawData){
$rawData='{"watchData":[],"attempts":[]}';
}
//if (!file_exists($dataPath)) {
//    file_put_contents($dataPath, '{"watchData": [],"attempts": []}');
//}
// Get student data
$a = json_decode($rawData);
$a -> netID = $_SERVER['cn'];
$a -> firstname = $_SERVER['givenName'];
$a -> nickname = $_SERVER['nickname'];
$a -> lastname = $_SERVER['sn'];
print json_encode($a);
?>

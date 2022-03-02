<?php
//ignore_user_abort(true);
$netID = $_SERVER['cn'];
if($_GET['reset']){
$path = array_reverse(preg_split("/\//",getcwd()));
$dirName= $path[1];
print $dirName;
$permissions = json_decode(file_get_contents("json/permissions.json"));
$canReset= in_array($netID,$permissions->canAccessData) || $netID==$dirName || $netID==$permissions->editor;
if($canReset)
{
$userFile="data/${_GET['user']}";
if(file_exists($userFile))
{
unlink($userFile);
print("reset score for user ${_GET['user']}");
}
else(print "user ${_GET['user']} not found!");
}
else{
print("You don't have permission to reset user ${_GET['user']}");
}
exit();
}


if(!key_exists("data",$_POST))
{
$data = $_POST['userData'];
print_r($data);
file_put_contents("data/" . $netID, $data);
}
else{
$startTime=formatTime($_POST['data']['startTime']);


$text=ltrim($_POST['data']['text']);
if($startTime!=""){
$file="media/video.vtt";
$reg="($startTime.*$[\r\n]*)(.*)";
$vtt = file_get_contents($file);
$newVtt=preg_replace("/$reg/m","$1${text}", $vtt);
file_put_contents($file,$newVtt);
//print($reg); 
file_put_contents("history.txt","$netID $text\n",FILE_APPEND);
}
}

function formatTime($t) {

  return sprintf('%02d:%02d:%02d\.%03d', ($t/3600),($t/60%60), $t%60,($t-floor($t))*1000);
}


?>

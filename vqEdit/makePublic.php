<?
$path = $_REQUEST['path'];
$isPublic = $_REQUEST['isPublic'];
if ($isPublic == "true") {
    rename($path . "/.htaccess", $path . "/.htaccess_disabled");
}
else {
    rename($path . "/.htaccess_disabled", $path . "/.htaccess");
}
?>
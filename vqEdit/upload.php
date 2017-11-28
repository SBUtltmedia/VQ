<?
// Get netID
$resources = "emptyProjectLink";
$netID = $_SERVER['cn'];
// Count files
$dir = scandir("../users/" . $netID);
sort($dir, SORT_NUMERIC);
$numCount=preg_grep("/^(\d+)?$/",$dir);
$numFiles = 1;
$ok = false;
while ($ok == false) {
    if (file_exists("../users/$netID/$numFiles")) {
        $ok = false;
        $numFiles += 1;
    }
    else {
        $ok = true;
    }
}

// Path to move file to
$path = "../users/$netID/$numFiles";
$mediaPath = $path."/media/";
$fileName = $mediaPath . "video.";
`cp -r $resources $path`;

if (isset($_FILES['upload_file'])) {
    $newFileName = $_FILES['upload_file']['name'];
    $newFileExt = pathinfo($newFileName, PATHINFO_EXTENSION);
    $destPath = $fileName . $newFileExt;
    if(move_uploaded_file($_FILES['upload_file']['tmp_name'], $destPath)){
        sleep(1);
        echo $destPath;
    } else {
        echo "Error! " . $_FILES['upload_file']['tmp_name'];
    }
    exit;
} else {
    echo "No files uploaded ...";
}
?>

<?
// Get netID
$resources = "../vqPlayer/emptyProjectLink";
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
        $FileExt = pathinfo($newFileName, PATHINFO_EXTENSION);
        if($FileExt!="mp4" && $FileExt!="m4v"){

                echo "Error! not a mp4 or m4v " . $_FILES['upload_file']['tmp_name'];
        }
        else {
                $destPath = $fileName . "mp4";
                if(move_uploaded_file($_FILES['upload_file']['tmp_name'], $destPath)){
                        sleep(1);
                        echo $destPath;
                } else {
                        echo "Error! " . $_FILES['upload_file']['tmp_name'];
                }
                exit;
        }} else {
                echo "No files uploaded ...";
        }

?>

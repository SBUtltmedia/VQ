<?
// Get netID and the ID of the quiz to delete
$netID = $_SERVER['cn'];
$quizID = $_REQUEST['quizID'];
$uniqueID = uniqid();
$srcPath = '../users/' . $netID . '/' . $quizID;
$destPath = '../users/' . $netID . '/.trash/' . $quizID . "_" . $uniqueID;
// If the current user does not have a .trash directory, make them one
if (!file_exists($destPath)) {
    mkdir($destPath, 0777, true);
}
// Move the directory to the trash
`mv $srcPath $destPath`;
?>

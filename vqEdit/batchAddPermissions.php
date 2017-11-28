<?
require('injectUserPath.php');
$quizzes = json_decode($_REQUEST['quizzes']);
$users = json_decode($_REQUEST['users']);
foreach($quizzes as $quiz) {

    $quizPermissionsPath = injectUserPathN($quiz . "/json/permissions.json",4);
	    print($quizPermissionsPath);
    $quizPermissions = new stdClass();
    $quizPermissions -> canAccessData = array();
    if (file_exists($quizPermissionsPath)) {
        $quizPermissions = json_decode(file_get_contents($quizPermissionsPath));
    }
    foreach ($users as $user) {
        array_push($quizPermissions -> canAccessData, $user);
    }
    file_put_contents($quizPermissionsPath, json_encode($quizPermissions));
}
?>

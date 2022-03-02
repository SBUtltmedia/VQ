<?php


require("injectUserPath.php");

#$qp = injectUserPathN($_REQUEST['quizPath'],4);


function file_get_json($jsonPath) {
	$jsonPath = injectUserPath($jsonPath);
	#print 	$jsonPath;
    if (file_exists($jsonPath)) {
        $json = file_get_contents($jsonPath);
    }
    else {
        $json = "{}";
    }
    return json_decode($json);
}

// Get path of quiz that is requested
$dir = injectUserPath($_REQUEST['quizPath']);
$dataPath = $dir . "/data";
$dataFiles = glob($dataPath . "/*");
$quizUserData = array();
// For each file, add it to the array
foreach($dataFiles as $file) {
    $fileData = file_get_json($file);    
    $pathSplit = explode("/", $file);
    $name = end($pathSplit);
    $fileData->netID = $name;
    array_push($quizUserData, $fileData);
}

$questionPath = $dir . "/json/quiz.json";
$questionData = file_get_contents($questionPath);

$data = new stdClass();
$data -> viewerData = $quizUserData;
$data -> quizData = json_decode($questionData);
    
$jsonStr = json_encode($data);
print($jsonStr);

?>


<?php
session_start();
header("Content-Type: application/json");

// Determine user identity
$netID = $_SESSION['mail'] ?? $_SERVER['mail'] ?? "";
if ($netID === "") {
    $netID = "guest_" . time();
}

$dataPath = "./data/" . $netID;

if (file_exists($dataPath)) {
    $rawData = file_get_contents($dataPath);
} else {
    // default empty userData schema
    $rawData = '{"watchData":[],"attempts":[],"answerData":[],"bestScore":0,"dataVersion":1}';
}

// Decode existing user data JSON
$a = json_decode($rawData);

// Add session info dynamically
$a->netID     = $_SESSION['mail'] ?? $_SERVER['mail'] ?? $netID;
$a->firstname = $_SESSION['givenName'] ?? $_SERVER['givenName'] ?? "";
$a->nickname  = $_SESSION['nickname'] ?? $_SERVER['nickname'] ?? "";
$a->lastname  = $_SESSION['sn'] ?? $_SERVER['sn'] ?? "";

echo json_encode($a);
?>

<?php
session_start();
header("Content-Type: application/json");

// Handle reset functionality
if (array_key_exists("reset", $_GET)) {
    $netID = $_SESSION["mail"] ?? $_SERVER["mail"] ?? "error_" . time();
    $path = array_reverse(preg_split("/\//", getcwd()));
    $dirName = $path[1];
    
    if (file_exists("json/permissions.json")) {
        $permissions = json_decode(file_get_contents("json/permissions.json"));
        $canReset = in_array($netID, $permissions->canAccessData) ||
                   $netID == $dirName ||
                   $netID == $permissions->editor;
    } else {
        $canReset = true; // Allow reset if no permissions file
    }
    
    if ($canReset) {
        $userFile = "data/" . $_GET["user"];
        if (file_exists($userFile)) {
            unlink($userFile);
            echo json_encode(["status" => "success", "message" => "reset score for user " . $_GET["user"]]);
        } else {
            echo json_encode(["status" => "error", "message" => "user " . $_GET["user"] . " not found!"]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "You don't have permission to reset user " . $_GET["user"]]);
    }
    exit();
}

// Handle user data saving
if (isset($_POST['user']) && isset($_POST['userData'])) {
    $user = $_POST['user'];
    $userData = $_POST['userData']; // already a JSON string

    // Ensure data directory exists
    if (!file_exists("data")) {
        mkdir("data", 0777, true);
    }

    // Save raw JSON under ./data/<user>
    if (file_put_contents("data/" . $user, $userData)) {
        echo json_encode(["status" => "success", "message" => "OK"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Unable to write file"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing parameters"]);
}
?>


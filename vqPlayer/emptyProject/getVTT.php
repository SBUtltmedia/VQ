<?php
$vtt="media/video.vtt";   
if (file_exists($vtt)){
$output=file_get_contents($vtt);
}
else {
$output=file_get_contents("media/autosub.en.vtt");
}
print $output;

<?

	$fname = $_SERVER['SCRIPT_FILENAME'];
	$old = file_get_contents($fname);
	#$content = explode("\n", $content);
	#$content = implode('#', $content);
	#$content = '<!--'.$content.'-->' . $content;
	$hideold = str_replace('<?', '<!--', $old);
	$hideold = str_replace('?>', '-->', $hideold);
	$new = str_replace('include "compile.php";', "echo 'It works.'", $old);
	$new = str_replace('=>[]', '=>array()', $new);
	$content = $hideold . "\n" . $new;
	file_put_contents($fname, $content);
	#return $content;
	include $fname;

?>
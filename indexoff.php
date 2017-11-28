<?php
	function getdir() {
		return array_pop(explode('/', getcwd()));
	}
	function gettemplate() {
		return file_get_contents('httemplate');
	}
	function gethtaccess() {
		return 'RewriteBase /' . getdir() . "\n" . gettemplate();
	}
	function sethtaccess() {
		file_put_contents('.htaccess', gethtaccess());
	}
	sethtaccess();
	include 'index.html';
	#echo 'Refresh';
?>
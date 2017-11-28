<?php

	/*
		Date:	Fall 2017
		Author:	Anthony John Ripa
	*/

	require_once('Scanner.php');
	
	$sc = new Scanner(__dir__);
	print_r($sc->gets0());
	echo '<br>';
	print_r($sc->gets());
	echo '<br>';
	echo $sc->get0();
	echo '<br>';
	echo $sc->get();
	echo '<br>';
	echo $sc->find0('htdocs');
	echo '<br>';
	echo $sc->find('htdocs');
	echo '<br>';

?>
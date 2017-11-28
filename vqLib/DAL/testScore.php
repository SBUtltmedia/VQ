<!--
	Date:		Fall 2017
	Authors:	Anthony John Ripa
 -->
 <?

	require ('Score.php');

	$score = Score::parse('{"title":"Use Outlook contacts for mail merge","duration":"00:01:38.27","completeData":"2017-08-17T13:21:50.837Z","watchData":[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0]}');
	
	print_r ($score->title);			echo '<br>';
	print_r ($score->duration);			echo '<br>';
	print_r ($score->completeData);		echo '<br>';
	print_r ($score->watchData);		echo '<br>';
	print_r ($score->getWatchTime());	echo '<br>';

?>
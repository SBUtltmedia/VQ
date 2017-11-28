<!--
	Date:		Fall 2017
	Authors:	Anthony John Ripa
 -->
<?

	require ('Scores.php');
	
	$scores = Scores::parse('[{"title":"Use Outlook contacts for mail merge","duration":"00:01:38.27","completeData":"2017-08-17T13:21:50.837Z","watchData":[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0]},{"title":"Fix photos faster with content-aware tools","duration":"00:05:56.89"},{"title":"Add a section, header, or footer","duration":"00:03:50.13","completeData":"2017-08-17T13:38:50.126Z","watchData":[2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,4,3,3,3,3,3,3,3,3,3,4,3,3,3,3,3,3,3,3,3,4,4,4,4,4,4,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]}]');

	foreach($scores->scores as $score) {
		echo "Title: ";			print_r ($score->title);			echo '<br>';
		echo "Duration: ";		print_r ($score->duration);			echo '<br>';
		echo "CompleteData: ";	print_r ($score->completeData);		echo '<br>';
		echo "WatchData: ";		print_r ($score->watchData);		echo '<br>';
		echo "getWatchTime: ";	print_r ($score->getWatchTime());	echo '<br><br>';
	}
	echo "getWatchTime: ";	print_r ($scores->getWatchTime());		echo '<br><br>';

?>
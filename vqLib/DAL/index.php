<?

	/*
		Date:	Fall 2017
		Author:	Anthony John Ripa
	*/
	
	require_once ('Authors.php');
	require_once ('Quiznums.php');
	require_once ('Consumers.php');
	require_once ('Duration.php');
	#require_once ('DAL.php');
	
	$author  = isset($_GET['author'])  ? $_GET['author']  : NULL;
	$quiznum = isset($_GET['quiznum']) ? $_GET['quiznum'] : NULL;
	$consumer = isset($_GET['consumer']) ? $_GET['consumer'] : NULL;
	$duration = isset($_GET['duration']);

	if ($author) {
		$durationObj = new Duration($author);
		if ($quiznum && $consumer) $response = $durationObj->getByQuiznumAndConsumer($quiznum, $consumer);
		#if ($author && $quiznum && $consumer) $response = DAL::UsageLen__Author_Videoid_Consumer($author, $quiznum, $consumer);
		else if ($consumer) $response = $durationObj->getByConsumer($consumer);
		#else if ($author && $consumer) $response = DAL::UsageLen__Author_Consumer($author, $consumer);
		else if ($quiznum && $duration) $response = $durationObj->getByQuiznum($quiznum);
		else if ($duration) $response = DAL::UsageLen__Author($author);
		#else if ($author && $quiznum && $duration) $response = DAL::VideoLen__Author_Videoid($author, $quiznum);
		else if ($quiznum) $response = Consumers::get($author, $quiznum);
		#else if ($author && $quiznum) $response = DAL::Consumers__Author_Videoid($author, $quiznum);
		else if (isset($_GET['consumer'])) $response = DAL::Consumers__Author($author);
		#else $response = Quiznums::get($author);
		else $response = DAL::UsageLen__Author($author);
		#else if ($author) $response = DAL::Videoids__Author($author);
	}
	else if (isset($_GET['author'])) $response = Authors::withAtLeastNVideos(3);
	#else if (isset($_GET['author'])) $response = DAL::Authors__VideoCount(3);
	else $response = Authors::get();
	#else $response = DAL::Authors();
	
	echo json_encode($response);
	
?>
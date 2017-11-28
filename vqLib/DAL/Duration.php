<?

	/*
		Date:	Fall 2017
		Author:	Anthony John Ripa
	*/

	require_once ('DAL.php');

	class Duration {
		
		function Duration($author) { $this->author = $author; }
		
		function getByQuiznum($quiznum) {
			return DAL::VideoLen__Author_Videoid($this->author, $quiznum);
		}
		
		function getByConsumer($consumer) {
			return DAL::UsageLen__Author_Consumer($this->author, $consumer);
		}			

		function getByQuiznumAndConsumer($quiznum, $consumer) {
			return DAL::UsageLen__Author_Videoid_Consumer($this->author, $quiznum ,$consumer);
		}			

	}

?>
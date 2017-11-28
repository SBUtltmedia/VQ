<?

	/*
		Date:	Fall 2017
		Author:	Anthony John Ripa
	*/
	
	require_once ('DAL.php');

	class Consumers {
		function get($author, $quiznum) {
			return DAL::Consumers__Author_Videoid($author, $quiznum);
		}
	}

?>

<?

	/*
		Date:	Fall 2017
		Author:	Anthony John Ripa
	*/
	
	require_once ('DAL.php');

	class Quiznums {
		function get($author) {
			return DAL::Videoids__Author($author);
		}
	}

?>
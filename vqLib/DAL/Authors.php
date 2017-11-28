<?

	/*
		Date:	Fall 2017
		Author:	Anthony John Ripa
	*/
	
	require_once ('DAL.php');

	class Authors {
		public static function get() {
			return DAL::Authors();
		}
		public static function withAtLeastNVideos($n) {
			return DAL::Authors__VideoCount($n);
		}
	}

?>
<?php

	/*
		Date:	Fall 2017
		Author:	Anthony John Ripa
	*/

	require ('Score.php');
	
	class Scores {
		public function Scores($scores) { $this->scores = $scores; }
		public static function parsej($json) { return new Scores(array_map('Score::parsej',$json)); }
		public static function parse($str) { return self::parsej(json_decode($str)); }
		public function getWatchTime() { return array_reduce($this->scores, function($sum,$guy){return $sum+$guy->getWatchTime();} ); }
	}
	
?>
<!--
	Date:		Fall 2017
	Authors:	Anthony John Ripa
 -->
<?

	class Score {
		public function Score($title, $duration, $completeData, $watchData) {
			$this->title			= $title;
			$this->duration			= strtotime("1970-01-01 $duration UTC");
			$this->completeData		= strtotime($completeData);
			$this->watchData		= $watchData;
		}
		public static function parsej($j) {
			return new Score($j->title, $j->duration, isset($j->completeData)?$j->completeData:'0', isset($j->watchData)?$j->watchData:array());
		}
		public static function parse($str) {
			return self::parsej(json_decode($str));
		}
		public function getWatchTime() {
			return $this->watchData ? $this->duration * $this->getWatchRatio() : 0;
		}
		private function getWatchRatio() {
			return array_reduce($this->watchData,function($sum,$guy){return $guy>0?$sum+1:$sum;}) / count($this->watchData);
		}
	}

?>
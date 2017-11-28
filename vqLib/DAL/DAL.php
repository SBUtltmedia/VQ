<?

	/*
		Date:	Fall 2017
		Author:	Anthony John Ripa
	*/

	require_once ('DBAL.php');
	
	class DAL extends DBAL {
	
		function Authors__VideoCount($n) {
			$ret = array();
			$allAuthors = DBAL::Authors();
			for ( $i = 0 ; $i < count($allAuthors) ; $i++ ) {
				if (count(DBAL::Videoids__Author($allAuthors[$i])) >= $n)
					$ret []= $allAuthors[$i];
			}
			return $ret;
		}
		
		//	Called by DAL::UsageLen__Author_Videoid_Consumer	
		function VideoLen__Author_Videoid($author, $videoid) {
			$video = DBAL::Video__Author_Videoid($author, $videoid);
			$duration = isset($video->duration) ? $video->duration : 0;
			return strtotime("1970-01-01 $duration UTC");
		}
		
		//	Called by DAL::UsageLen__Author_Consumer	
		function UsageLen__Author_Videoid_Consumer($author, $videoid, $consumer) {
			$usage = DBAL::Usage__Author_Videoid_Consumer($author, $videoid, $consumer);
			if ($usage === NULL) return 0;
			$watchData = $usage->watchData;
			if (count($watchData) === 0) return 0;
			#$percent = array_reduce($watchData,function($sum,$guy){return $guy>0?$sum+1:$sum;}) / count($watchData);
			$percent = array_sum($watchData) / count($watchData);
			$duration = DAL::VideoLen__Author_Videoid($author, $videoid);
			return round($percent * $duration);
		}

		//	Called by DAL::UsageLen__Author	
		function UsageLen__Author_Consumer($author, $consumer) {
			#$ret = 0;
			#$ret = array();
			#$ret = new ArrayObject();
			$ret = array('id'=>array(),'data'=>array());
			foreach(DBAL::Videoids__Author($author) as $videoid) {
				$usagelen = DAL::UsageLen__Author_Videoid_Consumer($author, $videoid, $consumer);
				#$ret+= $usagelen;
				$ret['id'][] = $videoid ;
				$ret['data'][] = $usagelen ;
				#if ($usagelen>0) $ret[$videoid] = $usagelen ;
			}
			return $ret;
		}
	
		//	Called by DAL::UsageLen__Author	
		function Consumers__Author($author) {
			$ret = array();
			foreach(DBAL::Videoids__Author($author) as $videoid)
				$ret = array_merge($ret, DBAL::Consumers__Author_Videoid($author, $videoid));
			sort($ret);
			return array_values(array_unique($ret));
		}
		
		function UsageLen__Author($author) {
			if ($author === 'me') $author = $_SERVER['cn'];
			session_save_path('temp'); session_start();
			if (isset($_SESSION[$author])) return $_SESSION[$author];
			$ret = array('id'=>array(),'data'=>array());
			foreach(DAL::Consumers__Author($author) as $consumer) {
				array_push($ret['id'] , $consumer );
				array_push($ret['data'] , DAL::UsageLen__Author_Consumer($author, $consumer) );
				#$ret[$consumer]= DAL::UsageLen__Author_Consumer($author, $consumer);
			}
			$_SESSION[$author] = $ret;
			return $ret;
		}
	
	}

?>
<?php

	/*
		Date:	Fall 2017
		Author:	Anthony John Ripa
	*/

	require_once ('Dir.php');
	require_once ('Scanner.php');
	
	ini_set('memory_limit','1G');

	class DBAL {
			
		//	Called by DAL::Authors__VideoCount
		function Authors() {
			static $authors; if ($authors) return $authors;																		//	cache
			$dirs = array_filter(glob(Dir::db() . '*'), 'is_dir');
			$authors = array_map('Scanner::get', $dirs);
			sort($authors);
			return $authors;
		}
		
		//	Called by DAL::Authors__VideoCount
		//	Called by DAL::Consumers__Author
		function Videoids__Author($author) {
			static $videoids; if (isset($videoids[$author])) return $videoids[$author];											//	cache
			$dirs = array_filter(glob(Dir::db() . "$author/*"),'is_dir');
			$videoids[$author] = array_map('Scanner::get', $dirs);
			sort($videoids[$author]);
			return $videoids[$author];
		}

		//	Called by DAL::Consumers__Author
		function Consumers__Author_Videoid($author, $videoid) {
			static $consumers; if (isset($consumers[$author . $videoid])) return $consumers[$author . $videoid];				//	cache
			$dirs = array_filter(glob(Dir::db() . "$author/$videoid/data/*"), 'is_file');
			$consumers[$author . $videoid] = array_map('Scanner::get', $dirs);
			sort($consumers[$author . $videoid]);
			return $consumers[$author . $videoid];
		}
		
		//	Called by DAL::VideoLen__Author_Videoid
		function Video__Author_Videoid($author, $videoid) {
			static $video; if (isset($video[$author . $videoid])) return $video[$author . $videoid];							//	cache
			$video[$author . $videoid] = json_decode(file_get_contents(Dir::db() . "{$author}/{$videoid}/json/quiz.json"));
			return $video[$author . $videoid];
		}
		
		//	Called by DAL::UsageLen__Author_Videoid_Consumer
		function Usage__Author_Videoid_Consumer($author, $videoid, $consumer) {
			static $usage; if (isset($usage[$author . $videoid . $consumer])) return $usage[$author . $videoid . $consumer];	//	cache
			if ($consumer === 'me') $consumer = $_SERVER['cn'];
			$fname = Dir::db() . "{$author}/$videoid/data/$consumer";
			if (!file_exists($fname)) return NULL;
			$usage[$author . $videoid . $consumer] = json_decode(file_get_contents($fname));
			return $usage[$author . $videoid . $consumer];
		}
		
	}

?>
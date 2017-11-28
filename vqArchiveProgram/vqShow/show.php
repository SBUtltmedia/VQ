<?
$blackList = array("vqEdit", "vqList", "vqShow");
chdir("../");
$allVQ = array();
foreach(glob("*") as $userDir)
{
	if(!in_array($userDir,$blackList) && is_dir($userDir))
	{
		chdir($userDir);
		$vqList= array();
		foreach(glob("*") as $vqDir)
		{
			if(is_numeric($vqDir))
			{
				$addIVQ=True;
				$permissionsFile="$vqDir/json/permissions.json";
				if(file_exists($permissionsFile)){
					$permissions=json_decode(file_get_contents($permissionsFile));
					if (array_key_exists("isPrivate",$permissions) && $permissions->isPrivate==1) 
					{$addIVQ=False;}

				}
				if ($addIVQ){

					$title= json_decode(file_get_contents("$vqDir/json/quiz.json"))->title;

					array_push($vqList,(int)$vqDir);	
				}			
			}
		}
		if(count($vqList)>22)
		{
			sort($vqList);
			$allVQ[$userDir]=$vqList;
		}
		chdir("../");
	}
}
print(json_encode($allVQ));
?>

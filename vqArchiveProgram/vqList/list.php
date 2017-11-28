<?
$blackList=array("vqEdit","vqList");
chdir("../");
$allVQ=array();
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
		                       $permissionsFile="$vqDir/json/permissions.json";
                                if(file_exists($permissionsFile))
				{
				
                                	$permissions=json_decode(file_get_contents($permissionsFile));
					if(!key_exists("isPrivate",$permissions) || $permissions->isPrivate!="false")
					{
					array_push($vqList,(int)$vqDir);	
					}
				}
				else { file_put_contents($permissionsFile,"{}");}	
			}
		}
                        if(count($vqList)>2)
                        
			{
			sort($vqList);
                                $allVQ[$userDir]=$vqList;
                        }


	chdir("../");
	}
}
print(json_encode($allVQ));
?>

import sys
import json
with open(sys.argv[1]) as x: f = x.read()
data=json.loads(f)
for i in range(len(data['watchData'])):
	data['watchData'][i]=1
	
f = open(sys.argv[1], "w")
f.write(json.dumps(data))
f.close()


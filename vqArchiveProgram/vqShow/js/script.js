$.ajax("show.php").done(function(data){makeMenu(JSON.parse(data))});

function makeMenu(menuData){
Object.keys(menuData).forEach(function(index){
console.log(index,menuData[index])
});

}


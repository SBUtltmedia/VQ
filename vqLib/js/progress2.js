
/*
	Date:		Fall 2017
	Authors:	Anthony John Ripa
				Rahul Sondhi
				Paul St. Denis
*/

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

var author= getParameterByName("author") || "me";
class Model {
	constructor(d) {
		this.ids = d.id;
		this.usage = d.data.map(x=>{
			function fixtime(t) { t = Math.round(t / 60); var m = t % 60; t = t - m; return 'H:M ' + (t/60) + ':' + m; }
			return [fixtime(x.data.reduce((sum,y)=>sum+y))]
		});
		//this.usage = d.data.map(s=>[new Date(s*1000).toISOString().substr(11,8)]);
		this.listeners = [];
	}
	getIds() { return this.ids; }
	getUsage() { return this.usage; }
	addListener(listener) { this.listeners.push(listener); }
	update() { this.listeners.map(x=>x.update()); }
}
class ViewModelTable {
	constructor(model) { this.model = model; }
	grid() { return this.model.getUsage(); }
	col0() { return this.model.getIds(); }
	row0() { return ['VideoId','Usage']; }
}
$.ajax({
	dataType: "json",
	url: 'DAL?author='+author,
	success: function init(data) {
		var model = new Model(data);
		var vTable = new VTable('#gallery', new ViewModelTable(model));
		resizeWindow();
	},
	error: function e(resp){alert(JSON.stringify(resp))}
});

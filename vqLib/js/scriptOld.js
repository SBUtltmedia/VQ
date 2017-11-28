
/*
	Date:		Fall 2017
	Authors:	Anthony John Ripa
				Rahul Sondhi
				Paul St. Denis
*/

class Model {
	constructor(courses) { this.courses = courses; }
	getAuthors() { return Object.keys(this.courses); }
	setIndex(index) { if (this.getAuthors()[index]) this.index = index; }
	getAuthor() { return this.getAuthors()[this.index]; }
	setAuthor(author) { this.setIndex(this.getAuthors().indexOf(author)); }
	set(x) { if (isNaN(x)) this.setAuthor(x); else this.setIndex(x); }
	getPlayList() { return this.getAuthor() ? this.courses[this.getAuthor()] : [] ; }
	getTitles() { return this.getPlayList().map(x=>x.title) }
}
class Controller {
	constructor(model, views) { this.model = model; this.views = views; this.views.map( view => view.init() ); }
	event(action) {
		this.model.set(action);
		this.views.map(view => view.update());
		resizeWindow();
	}
}
$.getJSON('/vq/vqLib/list2.php',
	function init(data) {
		var model = new Model(data);
		var viewhead = new ViewTitle('#Author',model,()=>model.getAuthor()?"Videos By "+ model.getAuthor() :"Choose Author:");
		var viewauthors = new ViewUL('#menu',model,model.getAuthors,model.getAuthor);
		//var viewpics = new ViewPics('#gallery',model,()=>model.getPlayList().map(x=>'../thumbnailer/'+model.getAuthor()+'/'+x+'/'),()=>model.getPlayList().map(x=>model.getAuthor()+'/'+x),model.getPlayList);
		var viewpics = new ViewPics('#gallery',model,()=>model.getPlayList().map(x=>'../thumbnailer/'+model.getAuthor()+'/'+x.number+'/'),()=>model.getPlayList().map(x=>model.getAuthor()+'/'+x.number),model.getTitles);
		document.controller = new Controller(model, [viewhead, viewauthors, viewpics]);
		document.controller.event(window.location.hash.slice(1));
		readUrl();
	}
)

function readUrl(){	
	console.log('Rahul: ' + getParameterByName('netID'));
	document.controller.event(getParameterByName('netID'));
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}


function postLTI(ses){

var dfd = jQuery.Deferred();
$.post( "/LTI/postLTI.php", {data:ses} ).done(function(result){

dfd.resolve(result)


});
 return dfd.promise();

}

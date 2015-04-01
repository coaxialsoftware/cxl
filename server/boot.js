
module.exports = function(filename)
{
var
	spawn = require('child_process').spawn,
	path = require('path'),

	child = spawn('iojs', [
		'--use-strict',
		'--harmony_classes',
		path.normalize(filename)
	], {
		//detached: true,
		stdio: [ 'ignore', process.stdout, process.stderr ]
	})
;
	child.unref();
};
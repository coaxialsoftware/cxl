
var
	cxl = require('./cxl-server')
;

cxl.log('Debug module enabled');

function override(obj, fn, pre, post)
{
	var old = obj[fn];

	obj[fn] = function()
	{
		if (pre)
			pre.apply(this, arguments);

		var result = old.apply(this, arguments);

		if (post)
		{
			var args = Array.prototype.slice.call(arguments);
			args.unshift(result);

			post.apply(this, args);
		}

		return result;
	};
}

//
// cxl
//
override(cxl, 'static', null, function(res, op) {
	this.log('Serving static files from ' + op);
});

//
// cxl.Module
//
override(cxl.Module.prototype, '_loadRoute', function(def) {
	this.log(`Loading ${def.id}`);
});

override(cxl.Module.prototype, 'start', function() {
	this.log('Starting...');
}, function() {
	this.log('Module successfully started.');
});

override(cxl.Module.prototype, '_loadModel', function(def, name) {
	this.log('Loading model ' + name);
});

cxl.Module.prototype._loadDatabase = function()
{
var
	me = this,
	knex = require('knex')({
		client: 'pg',
		connection: this.db
	});

	knex.on('query', function(d) {
		me.log(d.sql + ' [ ' + d.bindings + ' ]');
	});

	this.bookshelf = require('bookshelf')(knex);
};

//
// cxl.Service
//
override(cxl.Service.prototype, 'handle', function(req) {
	this.module.log(`${this.name} ${req.method} ${req.path}`);
});

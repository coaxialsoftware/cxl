/**
 * cxl Debug module
 */

(function(cxl, Backbone, _) {
"use strict";

var assert = window.console.assert.bind(window.console);

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

function dbg()
{
	cxl.log.apply(cxl, arguments);
}

cxl.log = function(msg)
{
	var console = window.console;
	var name = this.name;
	var single = typeof(msg)==='string' ? '[' + name + '] ' + msg : msg;

	if (arguments.length>1)
	{
		console.groupCollapsed(single);
		_.each(arguments, console.log, console);
		console.groupEnd();
	} else
		console.log(single);

	return cxl;
};

override(cxl, 'include', function(module) {
	dbg('Including module ' + module);
});

override(cxl, 'resolve', null, function(result) {
	return result.fail(function() {
		cxl.error('Resolve failed.');
	});
});

//
// Router
//
override(cxl.Router.prototype, 'route', function(path) {
	dbg('Adding route "' + path + '"');
});

override(cxl.Router.prototype, 'execute', function(route, args) {
	dbg('Executing route.', route, args);
});

//
// cxl.Route
//
override(cxl.Route.prototype, 'unbind', function() {
	dbg('Destroying route.', this);
});


// Backbone.History
override(Backbone.History.prototype, 'loadUrl', null,
	function(res, fragment)
	{
		fragment = fragment || this.fragment;

		if (fragment && !res)
			dbg('Route "' + fragment + '" not found');
	}
);

override(cxl.Binding.prototype, 'bind', function() {
	assert(this.refA);
	assert(this.refB);
});


})(this.cxl, this.Backbone, this._);
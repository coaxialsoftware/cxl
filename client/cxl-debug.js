/**
 * cxl Debug module
 */

(function(cxl, Backbone) {
"use strict";

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
	if (route.prototype instanceof cxl.Route)
		dbg('Executing route "' + route.prototype.path + '"', args);
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


})(this.cxl, this.Backbone);
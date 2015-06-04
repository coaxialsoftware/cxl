/**
 * cxl Debug module
 */

(function(cxl, Backbone, _) {
"use strict";

var console = window.console;
var assert = console.assert.bind(window.console);

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


function Notify(msg)
{
var
	method = this,
	single = typeof(msg)==='string' ? '[cxl] ' + msg : msg
;
	if (arguments.length>1)
	{
		console.groupCollapsed(single);
		_.each(arguments, function(v) { method(v); });
		console.groupEnd();
	} else
		this(single);

	return cxl;
}


function dbg()
{
	return Notify.apply(console.log.bind(console), arguments);
}

function warn()
{
	return Notify.apply(console.warn.bind(console), arguments);
}

cxl.warn = warn;
cxl.log = dbg;

override(cxl, 'include', function(module) {
	dbg('Including module ' + module);
});

override(cxl, 'resolve', null, function(result) {
	return result.fail(function() {
		cxl.error('Resolve failed.');
	});
});

override(cxl, 'onReady', null, function() {
	cxl.log('Framework initialized');
});

//
// Router
//
override(cxl.Router.prototype, 'route', function(path) {
	dbg('Adding route "' + path + '"');
});

override(cxl.Router.prototype, 'execute', function(route, args) {
	dbg('Executing route "' + route.prototype.path + '".', route, args);
});

//
// cxl.Route
//
override(cxl.Route.prototype, 'unbind', null, function() {
	dbg('Destroying route "' + this.path + '".', this, bindingCount + ' bindings remaining.');

	if (bindingCount!==0)
		warn(bindingCount + ' bindings not destroyed.');
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

//
// cxl.Binding
//
var bindingCount = 0;

override(cxl.Binding.prototype, 'bind', function() {
	assert(this.refA);
	assert(this.refB);
	bindingCount++;
});

override(cxl.Binding.prototype, 'unbind', function() {
	bindingCount--;
});

//
// cxl.TemplateCompiler
//
override(cxl.TemplateCompiler.prototype, 'compile', null,
function(result, el, scope) {
	var views=0;

	_.each(result.bindings, function(v) { if (v instanceof cxl.View) views++; });

	dbg('Template compiled. ' + views + ' Views, ' +
		(result.bindings.length-views) + ' Bindings (Total ' +
		bindingCount + ').',
		el, scope, result.__parsed, result.bindings
	);
});

override(cxl.TemplateCompiler.prototype, 'bindElement', function(el, b, result) {
	var p = result.__parsed = result.__parsed || [];
	p.push(b[0]);
});


})(this.cxl, this.Backbone, this._);
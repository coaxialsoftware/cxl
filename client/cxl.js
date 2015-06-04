/**
 *
 */
(function(window, $, _, Backbone) {
"use strict";

/**
 * Global router. By default it will only support
 * one level/state.
 *
 * @extends Backbone.Router
 */
var Router = Backbone.Router.extend({

	$content: null,
	started: false,
	currentView: null,
	routes: null,

	initialize: function(p)
	{
		this.routes = {};
		_.extend(this, p);
	},

	loadRoute: function(def, path)
	{
		def = typeof(def)==='function' ? def.call(this) : def;
		var view = cxl.Route.extend(def);

		view.prototype.path = path;

		cxl.router.route(path, view);

		return this;
	},

	refresh: function()
	{
		if (Backbone.History.started)
			cxl.history.stop();

		cxl.history.start();
		this.started = true;
	},

	start: function()
	{
		this.$content = this.$content || $('[cxl-content]');
		_.each(this.routes, this.loadRoute, this);
		this.refresh();
	},

	execute: function(Callback, args)
	{
		if (Callback.prototype instanceof cxl.Route)
		{
			if (this.currentView)
				this.currentView.unbind();

			var view = this.currentView =
				new Callback({ parameters: args });

			this.trigger('cxl.route', view);
			this.$content.html(view.$el);

		} else if (Callback)
			Callback.apply(this, args);
	}

});

function View(options)
{
    _.extend(this, options);

	if (this.el)
		this.setElement(this.el);

    this.load(this.$el, this.parameters, this.parent);
}

_.extend(View, {
	extend: Backbone.View.extend
});

_.extend(View.prototype, Backbone.Events, {

	/// {function(el)}
	initialize: null,

	/// {function(el)
	render: null,

	/// {funcion(val)}
	update: null,

	/// Current View Value
	value: null,

	/// Set if error
	error: null,

	setElement: function(el)
	{
		this.$el = $(el);
		this.el  = this.$el[0];
	},

	load: function(el, args, parent)
	{
	var
		view = this
	;
		if (view.initialize)
		    view.initialize(el, args, parent);

		if (view.template)
			view.loadTemplate(view.template);

		if (view.render)
			view.render(el, args, parent);
	},

	val: function()
	{
		return this.value;
	},

	set: function(value, onComplete)
	{
		if (this.value !== value)
		{
			this.value = value;

			if (this.update)
				this.update(value, this.$el, this.parameters, this.parent);

			if (onComplete)
				onComplete(this.error);

			this.trigger('value', this);
		}

		return this;
	},

	stopListening: function()
	{
		_.invoke(this._listeningTo, 'call');

		return this;
	},

	listenTo: function(obj, name, callback)
	{
	var
		listeningTo = this._listeningTo || (this._listeningTo = []),
		fn = callback.bind(this)
	;
		obj.on(name, fn);
		listeningTo.push(obj.off.bind(obj, name, fn));

		return this;
	},

	unbind: function()
	{
		if (this.template)
			this.template.destroy();

		this.off();
		this.stopListening();
	},

	loadTemplate: function(template)
	{
		var tpl = this.template = cxl.compile(template, this);

		if (!this.el)
			this.setElement(tpl.el);
		else
			this.$el.html(tpl.el);
	}

});

var Route = View.extend({

	constructor: function(op)
	{
		if (typeof(op)==='function')
			op = { initialize: op };
		View.call(this, op);
	},

	load: function(el, args, scope)
	{
	var
		me = this,
		resolve = me.resolve,
		load = cxl.View.prototype.load.bind(me, el, args, scope)
	;
		if (typeof(resolve)==='function')
			resolve = resolve.apply(me, args);

		if (resolve)
			cxl.resolve(resolve).then(function(resolved) {
				me.resolve = resolved;
				load();
			});
		else
			load();
	}


});

// TODO See if its worth it to actually have modules.
function Module(options)
{
	_.extend(this, options);
	this.initialize();
}

_.extend(Module.prototype, {

	name: null,

	/**
	 * Throws an error.
	 */
	error: function(msg)
	{
		throw new Error('[' + this.name + '] ' + msg);
	},

	// Disable login in production.
	log: function() { },

	ready: function(fn)
	{
		$(fn);

		return this;
	}

});

/** @namespace */
var cxl = window.cxl = new Module({

	name: 'cxl',

	router: null,

	Route: Route,
	View: View,

	initialize: function()
	{
		this.router	= new Router();
		this.history = Backbone.history;

		this.ready(this.onReady.bind(this));
	},

	onReady: function()
	{
		_.extend(this, {
			$body: $('body'),
			$window: $(window)
		});
	},

	start: function()
	{
		this.router.start();
		this.$body.addClass('cxl-ready');
	},

	route: function(path, def)
	{
		this.router.routes[path] = def;
	},

	view: function(def)
	{
		return new cxl.View(def);
	},

	directive: function(name, Fn)
	{
		if (Fn===undefined)
			return cxl.templateCompiler.directives[name];

		var d = Fn;

		if (_.isPlainObject(Fn))
			Fn = cxl.View.extend(Fn);

		if (Fn.prototype instanceof cxl.View)
			d = function(el, param, scope)
			{
				return new Fn({
					el: el,
					parameters: param,
					parent: scope
				});
			};

		cxl.templateCompiler.directives[name] = d;

		return this;
	},

	go: function(path)
	{
		window.location.hash = path;
		return this;
	},

	/**
	 * TODO ?
	 * looks for property prop in the current scope
	 * and its parents until found and returns it.
	 */
	result: function(scope, prop)
	{
		var result;

		do {
			result = _.result(scope, prop);
		} while (result===undefined && (scope = scope.parent));

		return result;
	},

	/**
	 * looks for property prop in the current scope
	 * and its parents until found and returns it. If it is a function
	 * it will return a binded function.
	 */
	prop: function(scope, prop)
	{
		var result=scope[prop];

		while (result===undefined && (scope = scope.parent))
			result = scope[prop];

		if (typeof(result)==='function')
			result = result.bind(scope);

		return result;
	},

	resolve: function(a)
	{
		var promises, keys;

		if ($.isPlainObject(a))
		{
			promises = _.values(a);
			keys = _.keys(a);

			return $.when.apply($, promises).then(function() {
				return _.object(keys, arguments);
			});
		}

		return $.when.apply($, a);
	},

	/**
	 * Test Browser support for certain features.
	 */
	support: {
		template: (function() {
			var div = document.createElement('template');
			return !!div.content;
		})(),

		createContextualFragment: (function() {
			try {
				document.createRange().createContextualFragment("Hello");
				return true;
			} catch(e) {
				return false;
			}
		})()
	}

});


})(this, this.jQuery, this._, this.Backbone);
/**
 *
 */
(function(window, $, _, Backbone) {
"use strict";

var
	__modules = {},
	__templates = {}
;

/** @namespace */
var cxl = window.cxl = function(module)
{
var
	result = __modules[module] ||
		(__modules[module] = new cxl.Module({
			name: module
		}))
;
	return result;
};

/* On ready */
$(function() {

	var $content = cxl.$content || $('[cxl-content]');

	_.extend(cxl, {
		$body: $('body'),
		$window: $(window),
		$doc: $(document),
		$content: $content,
		router: new cxl.Router({ $content: $content })
	});

	// Autoload modules
	$('[cxl]').each(function() {
		cxl.include(this.getAttribute('cxl'));
	}).addClass('cxl-ready');

});

/* Utilities */
_.extend(cxl, {

	error: function(msg)
	{
		window.console.error(msg);
	},

	go: function(path)
	{
		window.location.hash = path;

		return this;
	},

	include: function(module)
	{
		var m = __modules[module];

		if (!m)
			throw new Error('Module "' + module + '" not found.');

		return m.start();
	},

	log: function()
	{
		window.console.log.apply(window.console, arguments);
		return cxl;
	},

	// Creates a template
	template: function(id)
	{
		var html;

		if (__templates[id])
			return __templates[id];

		html = document.getElementById(id).innerHTML;

		return (__templates[id] = _.template(html));
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
	}

});

cxl.View = Backbone.View.extend({

	selector: null,
	module: null,

	resolve: null,

	constructor: function cxlView(options)
	{
	var
		view = this,
		args = options && options.parameters,
		resolve = view.resolve || view.module.resolve
	;
	    view.cid = _.uniqueId('view');
	    _.extend(view, options);
	    view._ensureElement();

		if (typeof(resolve)==='function')
			resolve = resolve.apply(view, args);

		function load(resolved)
		{
			if (resolved)
				view.resolve = resolved;

		    view.initialize.apply(view, args);

			if (view.templateUrl)
				view.template = cxl.template(view.templateUrl);
			else if (typeof(view.template) === 'string')
				view.template = _.template(view.template);

			if (view.template)
				view.$el.html(view.template(view));

		    view.delegateEvents();
		    // TODO set attributes object
			view.render();
		}

		if (resolve)
			cxl.resolve(resolve, view).then(load);
		else
			load();
	}

}, {
	extend: Backbone.View.extend,
	create: function(options)
	{
		return new this(options);
	}
});

/**
 * Global router. By default it will only support
 * one level/state.
 *
 * @extends Backbone.Router
 */
cxl.Router = Backbone.Router.extend({

	$content: null,
	currentView: null,

	initialize: function(p)
	{
		_.extend(this, p);
	},

	refresh: function()
	{
		if (Backbone.History.started)
			Backbone.history.stop();

		Backbone.history.start();
	},

	execute: function(Callback, args)
	{
		if (Callback.prototype instanceof cxl.View)
		{
			this.$content.children().addClass('leave');

			var view = this.currentView =
				new Callback({ parameters: args });

			this.$content.html(view.$el.addClass('enter'));
		} else if (Callback)
			Callback.apply(this, args);
	}

});

cxl.Model = Backbone.Model.extend({

}, {

	get: function(data, method)
	{
		var model = new this(data);
		method = method || 'fetch';

		return model[method]().then(function() {
			return model;
		});
	},

	create: function(id, init)
	{
		return this.get.apply(this, id ?
			[ {id: id} ] : [ init, 'save' ]);
	},

	query: function()
	{
		var collection = new Backbone.Collection();

		collection.url = this.prototype.urlRoot;

		return collection.fetch().then(function() {
			return collection;
		});
	}

});

cxl.Module = function cxlModule(options)
{
	_.extend(this, options);

	this.__config = [];
	this.__run = [];
	this.__views = {};
	this.__models = {};
	this.__routes = {};
};

_.extend(cxl.Module.prototype, {

	name: null,
	started: false,

	// Global resolve for routes or views.
	resolve: null,

	__config: null,
	__run: null,
	__views: null,
	__includes: null,
	__routes: null,
	__models: null,

	run: function(fn)
	{
		this.__run.push(fn);

		return this;
	},

	config: function(fn)
	{
		this.__config.push(fn);

		return this;
	},

	model: function(name, def)
	{
		if (def===undefined)
			return this.__models[name];

		this.__models[name] = def;

		return this;
	},

	route: function(path, fn)
	{
		this.__routes[path] = function() {
		var
			def = fn.call(this, this),
			options,
			view
		;
			if (typeof(def)==='function')
				view = def.bind(this);
			else
			{
				options = _.extend({
					module: this,
					path: path
				}, def);
				view = cxl.View.extend(options);
			}

			cxl.router.route(path, view);
		};

		return this;
	},

	view: function(selector, fn)
	{
		if (fn===undefined)
			return this.__views[selector];

		this.__views[selector] = fn;

		return this;
	},

	template: function(path)
	{
		return cxl.template(this.name + ':' + path);
	},

	start: function()
	{
		if (!this.started)
		{
			_.invoke(this.__config, 'call', this);
			_.each(this.__models, this.__loadModel, this);
			_.each(this.__views, this.__loadView, this);
			_.invoke(this.__routes, 'call', this);

			_.invoke(this.__run, 'call', this);

			delete this.__config;
			delete this.__run;

			cxl.router.refresh();

			this.started = true;
		}

		return this;
	},

	__loadModel: function(fn, name)
	{
		this.__models[name] = cxl.Model.extend(fn.call(this));
	},

	__loadView: function(fn, selector)
	{
		this.__views[selector] = cxl.View.extend(_.extend({
			selector: selector,
			module: this
		}, fn.call(this)));
	}

});

// Define cxl Module
cxl('cxl');

})(this, this.jQuery, this._, this.Backbone);
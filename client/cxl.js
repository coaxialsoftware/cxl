/**
 *
 */
(function(window, $, _, Backbone) {
"use strict";

var
	__modules = {},

	createFn = function() { return this; }
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

	// Setup dependencies
	// TODO should we remove this
	$.ajaxSetup({ xhrFields: { withCredentials: true } });

	_.extend(cxl, {
		$body: $('body'),
		$window: $(window),
		$doc: $(document),
		$content: $content,
		router: new cxl.Router({ $content: $content }),
		history: Backbone.history
	});

	// Autoload modules
	$('[cxl]').each(function() {
		cxl.include(this.getAttribute('cxl'));
	}).addClass('cxl-ready');

});

/* Utilities */
_.extend(cxl, {

	/**
	 * Throws an error.
	 */
	error: function(msg, module)
	{
		throw new Error('[' + (module||'cxl') + '] ' + msg);
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
			this.error('Module "' + module + '" not found.');

		return m.start();
	},

	log: function()
	{
		window.console.log.apply(window.console, arguments);
		return cxl;
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

	/// Owner module
	module: null,

	/// Template Id
	templateUrl: null,

	/**
	 * Enable binding. Can be a Firebase ref or a cxl.Binding object.
	 */
	bind: null,

	resolve: null,

	constructor: function cxlView(options)
	{
	var
		view = this,
		args = options && options.parameters,
		// TODO remove module resolve
		resolve = view.resolve || (view.module && view.module.resolve)
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
			    view.loadTemplate(view.template);

		    view.delegateEvents();
		    view.$el.on('change', view.onChange.bind(view));

		    if (view.bind)
			    view.loadBind(view.bind);

			view.render(view.$el);
		}

		if (resolve)
			cxl.resolve(resolve, view).then(load);
		else
			load();
	},

	onChange: function(ev)
	{
		this.trigger('change', ev);
	},

	loadBind: function(bind)
	{
		if (!$.isPlainObject(bind))
			bind = { ref: bind };

		bind.el = this;
		this.bind = new cxl.Binding(bind);
	},

	loadTemplate: function(template)
	{
		this.$el.html(template(this));
	},

	/**
	 * Set value of view. By default it will set the $el.val
	 */
	val: function(value)
	{
		return arguments.length>0 ? (this.$el.val(value),this) : this.$el.val();
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
			this.trigger('cxl.route', view);

		} else if (Callback)
			Callback.apply(this, args);
	}

});


cxl.Model = Backbone.Model;

_.extend(cxl.Model, {

	get: function(data, options)
	{
		var model = new this(data, options);

		return model.fetch().then(createFn.bind(model));
	},

	create: function(data, options)
	{
		if (!data.id)
			delete data.id;

		var model = _.extend(new this(data), options);

		return model[model.id ? 'fetch' : 'save']().then(createFn.bind(model));
	},

	query: function(options)
	{
		var collection = new Backbone.Collection(options);

		collection.model = this;
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

	extend: function(op)
	{
		return _.extend(this, op);
	},

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
					module: this
				}, def);
				view = cxl.View.extend(options);
			}

			cxl.router.route(path, view);
		};

		return this;
	},

	view: function(name, fn)
	{
		if (fn===undefined)
			return this.__views[name];

		this.__views[name] = fn;

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

			_.invoke(this.__run, 'call', this, this);

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

	__loadView: function(fn, name)
	{
		this.__views[name] = cxl.View.extend(_.extend({
			module: this
		}, fn.call(this)));
	}

});

// Define cxl Module
cxl('cxl');

})(this, this.jQuery, this._, this.Backbone);
/**
 *
 */
(function(window, $, _, Backbone) {
"use strict";

// Use Mustache templates
_.templateSettings.escape = /\{\{(.+?)\}\}/g;

function Module(options)
{
	_.extend(this, options);

	this.__config = [];
	this.__run = [];
	this.__views = {};
	this.__routes = {};
}

_.extend(Module.prototype, {

	name: null,
	started: false,

	__config: null,
	__run: null,
	__views: null,
	__includes: null,
	__routes: null,

	extend: function(op)
	{
		return _.extend(this, op);
	},

	/**
	 * Throws an error.
	 */
	error: function(msg)
	{
		throw new Error('[' + this.name + '] ' + msg);
	},

	log: function(msg)
	{
		window.console.log('[' + this.name + '] ' + msg);

		return cxl;
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

	route: function(path, fn)
	{
		this.__routes[path] = function() {
		var
			def = fn.call(this, this) || {},
			view
		;
			def.path = path;

			if (typeof(def)==='function')
				view = def.bind(this);
			else
				view = cxl.Route.extend(def);

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

	start: function()
	{
		var me = this;

		if (!me.started)
		{
			$(function() {
				_.invoke(me.__config, 'call', me);
				_.each(me.__views, me.__loadView, me);
				_.invoke(me.__routes, 'call', me);

				_.invoke(me.__run, 'call', me, me);

				delete me.__config;
				delete me.__run;

				me.started = true;
				cxl.router.refresh();
			});
		}

		return me;
	},

	__loadView: function(fn, name)
	{
	var
		def = _.extend(fn.call(this), {
			module: this, name: name
		}),
		view = this.__views[name] = cxl.View.extend(def)
	;
		cxl.register(view);
	}

});

/* On ready */
$(function() {

	var $content = cxl.$content || $('[cxl-content]');

	cxl.extend({
		$body: $('body'),
		$window: $(window),
		$doc: $(document),
		$content: $content,
		router: new cxl.Router({ $content: $content }),
		history: Backbone.history
	}).start();

	cxl.$body.addClass('cxl-ready');

});

/** @namespace */
var cxl = window.cxl = new Module({
	name: 'cxl',
	modules: {},
	templates: {},
	views: {},
	Module: Module,

	// TODO add name validation in debug module.
	module: function(name)
	{
		return this.modules[name] ||
			(this.modules[name]=new cxl.Module({ name: name }));
	},

	template: function(id)
	{
		return this.templates[id] ||
			(this.templates[id]=_.template(document.getElementById(id).innerHTML));
	},

	register: function(obj)
	{
	var
		parent = obj.prototype.module!==cxl && obj.prototype.module.name,
		path = (parent ? parent + '.' : '') + obj.prototype.name
	;
		this.views[path] = obj;
		return this;
	},

	go: function(path)
	{
		window.location.hash = path;
		return this;
	},

	/**
	 * Select node by id
	 */
	id: function(id)
	{
		return document.getElementById(id);
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

	support: {
		template: (function() {
			var div = document.createElement('template');
			return !!div.content;
		})()
	}

});


cxl.View = Backbone.View.extend({

	/// Template Id
	templateUrl: null,

	/// Bindings
	bindings: null,

	/// Reference for cxl.Binding
	ref: null,

	constructor: function cxlView(options)
	{
	var
		view = this,
		args = options && options.parameters
	;
	    view.cid = _.uniqueId('view');
	    _.extend(view, options);
	    view._ensureElement();
	    view.load(args);
	},

	load: function(args)
	{
	var
		view = this
	;
		if (view.templateUrl)
			view.template = cxl.template(view.templateUrl);

		if (typeof(view.template)==='string')
			view.template = _.template(view.template);

		if (view.template)
			view.loadTemplate(view.template);

	    view.initialize.call(view, view.$el, args);

		if (view.template)
			view.template = cxl.compile(view.$el, view.ref);

		// TODO see if we can put this back somehow
	    //view.delegateEvents();
	    view.$el.on('sync', view.onSync.bind(view));

		view.render(view.$el);
	},

	destroy: function()
	{
		if (this.template)
			this.template.unbind();
	},

	onSync: function(ev, err, val)
	{
		if (this.sync) this.sync(err, val);
		this.trigger('sync', err, val);
	},

	loadTemplate: function(template)
	{
		this.$el.html(template(this));
	}

}, {
	extend: Backbone.View.extend,
	create: function(options)
	{
		return new this(options);
	}
});

cxl.Route = cxl.View.extend({

	load: function(args)
	{
	var
		me = this,
		resolve = me.resolve,
		load = cxl.View.prototype.load.bind(me, args)
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
		if (Callback.prototype instanceof cxl.Route)
		{
			this.$content.children().addClass('leave');

			if (this.currentView)
				this.currentView.destroy();

			var view = this.currentView =
				new Callback({ parameters: args });

			this.$content.html(view.$el.addClass('enter'));
			this.trigger('cxl.route', view);

		} else if (Callback)
			Callback.apply(this, args);
	}

});

})(this, this.jQuery, this._, this.Backbone);
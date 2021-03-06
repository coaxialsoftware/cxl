/**
 *
 */
(function(window, $, _, Backbone) {
"use strict";

var
	// Link used by cxl.go to convert relative to absolute paths
	goLink = window.document.createElement('a')
;


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
		def = typeof(def)==='function' ? { initialize: def } : def;
		var view = cxl.Route.extend(def);

		view.prototype.path = path;

		this.route(path, view);

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
		if (this.started)
			return;

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
	
/**
 * A Listener mixin, supports on/off and addEventListener methods
 */
var Listener = {
	
	__listeners: null,
	
	stopListening: function(obj, ev, callback)
	{
		_.filter(this.__listeners, {
			obj: obj, ev: ev, callback: callback
		}).forEach(function(l) {
			l.obj.off(l.ev, l.fn);
		});
		
		return this;
	},
	
	listenTo: function(obj, ev, callback)
	{
	var
		l = this.__listeners || (this.__listeners=[]),
		fn = callback.bind(this),
		method = obj.on ? 'on' : 'addEventListener'
	;
		obj[method](ev, fn);
		l.push({ obj: obj, ev: ev, callback: callback, fn: fn });
		
		return this;
	}
	
};
	
var Events = _.extend(Backbone.Events, Listener);

function Emitter(options)
{
	_.extend(this, options);
	
	if (this.initialize)
		window.setTimeout(this.initialize.bind(this));
	
	this.listenTo(cxl, 'digest', this.onDigest);
}
	
Emitter.extend = Backbone.View.extend;

_.extend(Emitter.prototype, Events, {
	
	value: NaN,
	update: null,
	error: null,
	digest: null,
	
	onDigest: function()
	{
		if (this.digest)
			this.digest();
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
				this.update(value);

			if (onComplete)
				onComplete(this.error);

			this.trigger('value', this);
		}

		return this;
	},
	
	unbind: function()
	{
		this.off();
		this.stopListening();
	}

});

function View(options)
{
    _.extend(this, options);

	if (this.el)
		this.setElement(this.el);

    this.load(this.$el, this.parameters, this.parent);
}

View.extend = Backbone.View.extend;

_.extend(View.prototype, Listener, {

	/// {function(el)}
	initialize: null,

	/// {funcion(val)}
	setup: null,

	/// Current View Value
	value: null,

	/// Set if error
	error: null,
	
	/// Template string or function that returns a string.
	template: null,

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
	},

	unbind: function()
	{
		this.destroyTemplate();
		this.stopListening();
	},
	
	destroyTemplate: function()
	{
		if (this.__template && this.__template.destroy)
			this.__template.destroy();
	},
	
	digest: function()
	{
		if (this.__template && this.__template.digest)
			this.__template.digest();
	},

	loadTemplate: function(tpl)
	{
		tpl = tpl || this.template;
		
		if (this.__template)
			this.destroyTemplate();
	var
		compiled = this.__template = typeof(tpl)==='string' ?
			cxl.compile(tpl, this) :
			tpl(this),
		el = compiled.valueOf()
	;
		if (!this.el)
			this.setElement(el);
		else
			this.$el.html(el);
	},

	remove: function()
	{
		this.unbind();
		this.$el.remove();
	}

});

var Route = View.extend({

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
	Emitter: Emitter,
	Listener: Listener,
	Events: Events,
	Model: Backbone.Model,
	
	/**
	 * getElementById wrapper
	 */
	id: function(id)
	{
		return document.getElementById(id);
	},

	initialize: function()
	{
		this.router	= new Router();
		this.history = Backbone.history;

		this.ready(this.onReady.bind(this));
	},

	extend: _.extend.bind(_),

	onReady: function()
	{
		_.extend(this, {
			$body: $('body'),
			$window: $(window)
		});
	},

	start: function()
	{
		if (!this.router.started)
		{
			this.router.start();
			this.$body.addClass('cxl-ready');
		}
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
		
		if (_.isPlainObject(Fn))
			Fn = cxl.Emitter.extend(Fn);
		
		cxl.templateCompiler.directives[name] = Fn.extend ? 
			function(el, param, scope)
			{
				return new Fn({ el: el, parameters: param, parent: scope });
			} : Fn;

		return this;
	},

	/**
	 * Normalizes path.
	 */
	path: function(path)
	{
		if (path[0]!=='/')
			path = window.location.hash.substr(1) + '/' + path;
		
		goLink.setAttribute('href', path);
		path = goLink.pathname;

		return path;
	},

	/**
	 * Navigates to path.
	 */
	go: function(path)
	{
		window.location.hash = this.path(path);
		return this;
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
	
_.extend(cxl, Events);

})(this, this.jQuery, this._, this.Backbone);

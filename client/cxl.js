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
	this.initialize();

	if (this.ready)
		$(this.ready);
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

	log: function(msg)
	{
		window.console.log('[' + this.name + '] ' + msg);

		return cxl;
	},

	ready: null

});


/**
 * Global router. By default it will only support
 * one level/state.
 *
 * @extends Backbone.Router
 */
var Router = Backbone.Router.extend({

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

var View = Backbone.View.extend({

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

		view.render(view.$el);
	},

	destroy: function()
	{
		if (this.template)
			this.template.unbind();
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


var Route = View.extend({

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

/** @namespace */
var cxl = window.cxl = new Module({

	name: 'cxl',

	templates: {},
	views: {},
	router: null,

	Module: Module,
	Router: Router,
	Route: Route,
	View: View,

	initialize: function()
	{
		this.router	= new Router();
	},

	ready: function()
	{
		var $content = this.$content || $('[cxl-content]');

		_.extend(this, {
			$body: $('body'),
			$window: $(window),
			$doc: $(document),
			$content: $content
		});

		this.$body.addClass('cxl-ready');
		this.history = Backbone.history;

		Backbone.history.start();
	},

	route: function(path, def)
	{
		var view = typeof(def)==='function' ?
			def.bind(this) : view = cxl.Route.extend(def);

		cxl.router.route(path, view);

		return this;
	},

	view: function(name, fn)
	{
		if (fn===undefined)
			return this.views[name];

		this.views[name] = _.isPlainObject(fn) ?
			cxl.View.extend(_.extend(fn, { module: this, name: name })) :
			fn;

		return this;
	},

	template: function(id)
	{
		return this.templates[id] ||
			(this.templates[id]=_.template(document.getElementById(id).innerHTML));
	},

	go: function(path)
	{
		window.location.hash = path;
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
	}
	/*,

	support: {
		template: (function() {
			var div = document.createElement('template');
			return !!div.content;
		})()
	}*/

});





})(this, this.jQuery, this._, this.Backbone);
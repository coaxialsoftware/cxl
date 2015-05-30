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
				this.currentView.unbind();

			var view = this.currentView =
				new Callback({ parameters: args });

			this.$content.html(view.$el.addClass('enter'));
			this.trigger('cxl.route', view);

		} else if (Callback)
			Callback.apply(this, args);
	}

});

function View(options)
{
var
	view = this,
	args = options && options.parameters
;
    _.extend(view, options);
    view._ensureElement();
    view.load(args);
}

_.extend(View, {
	extend: Backbone.View.extend,

	create: function(options)
	{
		return new this(options);
	}
});

_.extend(View.prototype, Backbone.Events, {

	/// {function(el)}
	initialize: null,

	/// {function(el)
	render: null,

	/// Current View Value
	value: null,

	/// Validator
	validate: null,

	_ensureElement: function()
	{
		this.setElement(this.el ?
			_.result(this, 'el') :
			document.createDocumentFragment()
		);
	},

	setElement: function(el)
	{
		this.$el = $(el);
		this.el  = this.$el[0];
	},

	load: function(args)
	{
	var
		view = this
	;
		if (view.template)
		{
			view.loadTemplate(view.template);
			view.template = cxl.compile(view.el, view);
		}

		if (view.initialize)
		    view.initialize(view.$el, args, view.ref);
	},

	val: function()
	{
		return this.value;
	},

	child: function(childPath)
	{
		return this.ref.child(childPath);
	},

	set: function(value, onComplete)
	{
		var err;

		if (this.value !== value)
		{
			this.value = value;

			if (this.validate)
				err = this.validate(value);

			if (!err && this.render)
				this.render(value);

			if (onComplete)
				onComplete(err);

			this.trigger('value', this);
		}

		return this;
	},

	unbind: function()
	{
		if (this.template)
			this.template.destroy();
		this.off();
	},

	loadTemplate: function(template)
	{
		// Is it a documentFragment?
		// TODO should we assume it is empty?
		if (this.el.nodeType===11)
			this.$el.append(template);
		else
			this.$el.html(template);
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

// TODO See if its worth it to actually have modules.
function Module(options)
{
	_.extend(this, options);
	this.initialize();

	if (this.ready)
		$(this.ready.bind(this));
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

	ready: null

});

/** @namespace */
var cxl = window.cxl = new Module({

	name: 'cxl',

	templates: {},
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
		// TODO better content loading for router
		this.router.$content = this.$content;
	},

	start: function()
	{
		Backbone.history.start();
	},

	route: function(path, def)
	{
		var view = typeof(def)==='function' ?
			def.bind(this) : view = cxl.Route.extend(def);

		cxl.router.route(path, view);

		return this;
	},

	view: function(def)
	{
		return new cxl.View(def);
	},

	directive: function(name, fn)
	{
		if (fn===undefined)
			return cxl.templateCompiler.directives[name];

		var d = fn;

		if (_.isPlainObject(fn))
			fn = cxl.View.extend(fn);

		if (fn.prototype instanceof cxl.View)
			d = function(el, param, scope)
			{
				return fn.create({ el: el, parameters: param, ref: scope });
			};

		cxl.templateCompiler.directives[name] = d;

		return this;
	},

	template: function(id)
	{
		return this.templates[id] ||
			(this.templates[id]=document.getElementById(id).innerHTML);
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
	},

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
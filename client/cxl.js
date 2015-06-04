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
			cxl.history.stop();

		cxl.history.start();
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
    view.load(view.$el, args, view.parent);
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

	/// {funcion(val)}
	update: null,

	/// Current View Value
	value: null,

	/// Validator
	validate: null,

	_ensureElement: function()
	{
		this.setElement(this.el || document.createDocumentFragment());
	},

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

		if (view.template)
			view.template = cxl.compile(view.el, view);

		if (view.render)
			view.render(el, args, parent);
	},

	val: function()
	{
		return this.value;
	},

	set: function(value, onComplete)
	{
		var err;

		if (this.value !== value)
		{
			this.value = value;

			if (this.validate)
				err = this.validate(value);

			if (!err && this.update)
				this.update(value, this.$el, this.parameters, this.parent);

			if (onComplete)
				onComplete(err);

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

		this.stopListening();
	},

	loadTemplate: function(template)
	{
		// Is it a documentFragment?
		// TODO should we assume it is empty?
		if (this.el.nodeType===11)
		{
			if (this.el.children.length)
				this.$el.children().remove();

			this.$el.append(template);
		}
		else
			this.$el.html(template);
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

	templates: {},
	routes: null,
	router: null,

	Module: Module,
	Router: Router,
	Route: Route,
	View: View,
	History: Backbone.History,

	initialize: function()
	{
		this.router	= new Router();
		this.routes = {};
		this.history = Backbone.history;

		this.ready(this.onReady.bind(this));
	},

	onReady: function()
	{
		var $content = this.$content || $('[cxl-content]');

		_.extend(this, {
			$body: $('body'),
			$window: $(window),
			$doc: $(document),
			$content: $content
		});

		this.$body.addClass('cxl-ready');
		// TODO better content loading for router
		this.router.$content = this.$content;
	},

	start: function()
	{
		_.each(this.routes, this.loadRoute, this);
		Backbone.history.start();
	},

	loadRoute: function(def, path)
	{
		def = typeof(def)==='function' ? def.call(this) : def;
		var view = cxl.Route.extend(def);

		view.prototype.path = path;

		cxl.router.route(path, view);

		return this;
	},

	route: function(path, def)
	{
		this.routes[path] = def;
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
				return fn.create({
					el: el,
					parameters: param,
					parent: scope
				});
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
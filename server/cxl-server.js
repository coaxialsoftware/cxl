

var
	_ = require('lodash'),
	express = require('express'),
	colors = require('colors/safe'),
	pathToRegexp = require('path-to-regexp'),

	Query = require('./cxl-server-query'),

	__modules = {}
;

function abstract()
{
	throw "Attempting to call abstract function.";
}

function cxl(module)
{
	return __modules[module] ||
		(__modules[module] = new cxl.Module(module));
}

_.extend(cxl, {

	log: function(msg)
	{
		console.log(colors.cyan('cxl ') + msg);
	},

	error: function(msg)
	{
		console.error(colors.red(msg));

		if (msg instanceof Error)
			console.log(msg.stack);
	},

	/**
	 * Defines a class
	 *
	 * @param {class|function} A Class or function
	 * @param {object} prop Properties
	 * @param {object} static_prop Static Properties
	 */
	define(A, prop, static_prop)
	{
		_.extend(A.prototype, prop);

		A.extend = function(p, s)
		{
			var B = _.has(p, 'constructor') ? p.constructor :
				function() {
					A.apply(this, arguments);
				};

			B.prototype = _.create(A.prototype, p);

			return _.extend(B, s);
		};

		return _.extend(A, static_prop);
	}

});

cxl.Adapter = cxl.define(class Adapter {

	/**
	 * Connects to DB.
	 * @returns {Promise}
	 */
	connect() { abstract(); }

}, {

}, {

});

cxl.Route = cxl.define(class Route {

	get path()
	{
		return this.__path;
	}

	set path(val)
	{
		this.__path = val;
		this.__keys = [];

		this.regex = pathToRegexp(val, this.__keys);
	}

	match(path)
	{
		var m = this.regex.exec(req.path);

		if (m)
		{
			this.params = _.object(
				_.pluck(this.__keys, 'name'),
				m.slice(1)
			);

			return true;
		}
	}

}, {
	__path: null
});

cxl.Service = cxl.define(class Service {

	constructor(module, options)
	{
		var defaults = cxl.Service.defaults;

		this.module = module;
		this.model = options.model;

		this.route = new cxl.Route(_.extend({
			path: '/' + this.name + '/:id?'
		}, defaults.route, options.route));

		this.query = new cxl.Query(_.extend({
			idProperty: this.model.idProperty
		}, defaults.query, options.query));

		this.initialize();
	}

	GET(req, res)
	{
		return this.query.select();
	}

	POST(req, res)
	{
	}

	PUT(req, res)
	{

	}

	DELETE(req, res)
	{

	}

	parse(result)
	{
		console.log(result);
		var response = result.rows;

		if (response)
			response = route.isArray ? response : response[0];

		return response;
	}

	doQuery(q)
	{
		return this.module.db.query(q);
	}

	handle(req, res)
	{
	var
		query = this[req.method](req, res)
	;
		this.doQuery(query)
			.then(this.parse)
			.then(res.send.bind(res))
		;
	}

	middleware(req, res, next)
	{
		if (this.methods.indexOf(req.method)!==-1 &&
			this[req.method] && this.route.match(req.path))
		{
			req.params = this.route.params;
			return this.handle(req, res);
		}

		next();
	}

	initialize()
	{
	}

}, {

	module: null,

	/**
	 * HTTP Methods
	 * @default cxl.Service.defaults.methods
	 */
	methods: null

}, {

	defaults: {
		methods: [ 'GET', 'POST', 'PUT', 'DELETE' ]
	}

});

cxl.Module = cxl.define(class Module {

	constructor(name)
	{
		this.name = name;
		this.__services = {};
		this.__routes = [];

		this.__run = [];
		this.__config = [];
	}

	/**
	 * Laxily create a new express server.
	 */
	get server()
	{
		return this.__server || (this.__server = express());
	}

	/**
	 * Define a new service.
	 */
	service(name, fn)
	{
		var me = this, def, S;

		if (fn)
		{
			me.__routes.push({
				id: `service "${name}"`,
				fn: 'use',
				args: function()
				{
					def = fn();

					if (!def)
						me.error('Invalid service definition');

					def.name = name;
					S = me.__services[name] = new cxl.Service(me, def);

					return [ S.middleware.bind(S) ];
				}
			});

			return this;
		}

		// Service will be initialized by _loadRoute
		return this.__services[name];
	}

	config(fn)
	{
		this.__config.push(fn);
		return this;
	}

	run(fn)
	{
		this.__run.push(fn);
		return this;
	}

	// TODO support for creating session on the fly
	session(fn)
	{
		return this.use(fn());
	}

	/**
	 * Adds middleware to server
	 */
	use(middleware)
	{
		this.__routes.push({
			id: `middleware ${middleware.name}`,
			fn: 'use',
			args: [ middleware.bind(this) ]
		});

		return this;
	}

	/**
	 * Add new route. Order matters.
	 */
	route(method, path, fn)
	{
		this.__routes.push({
			id: `route ${method} ${path}`,
			fn: method.toLowerCase(),
			args: [ path, fn.bind(this) ]
		});

		return this;
	}

	/**
	 * Initialize module
	 */
	start()
	{
		_.invoke(this.__config, 'call', this);
		_.each(this.__routes, this._loadRoute, this);

		if (this.__server)
			this.startServer();

		_.invoke(this.__run, 'call', this);
	}

	onServerStart()
	{
		var a = this.__listener.address();

		this.log('Listening in ' + a.address + ':' + a.port);
	}

	onServerError(e)
	{
		if (e.code==='EACCES')
			this.error('Could not start server in ' +
				this.host + ':' + this.port +
				'. Make sure the host and port are not already in use.'
			);
		else
			this.error(e);
	}

	startServer()
	{
		var l = this.server.listen(this.port, this.host,
			this.onServerStart.bind(this));

		this.__listener = l;

		l.on('error', this.onServerError.bind(this));
	}

	log(msg)
	{
		console.log((this.logColor ?
			colors[this.logColor](this.name) : this.name) +
			' ' + msg
		);
	}

	error(msg)
	{
		cxl.error(msg);
	}

	extend(prop)
	{
		return _.extend(this, prop);
	}

	// TODO add validation
	_loadRoute(def)
	{
		var args = _.result(def, 'args');

		this.server[def.fn].apply(this.server, args);
	}

}, {

	name: null,
	logColor: 'blue',

	port: 80,
	host: 'localhost',

	/**
	 * @type {express.Application}
	 */
	__server: null,

	/**
	 * Node Server
	 */
	__listener: null,

	__services: null,
	__routes: null,

	__config: null,
	__run: null

}, {

});

module.exports = cxl;

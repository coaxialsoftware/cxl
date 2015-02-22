

var
	_ = require('lodash'),
	express = require('express'),
	colors = require('colors/safe'),

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

cxl.Service = cxl.define(class Service {

	constructor(module, options)
	{
		this.module = module;
		this.server = module.server;

		_.extend(this, cxl.Service.defaults, options);

		this.initialize();
	}

	middleware()
	{

	}

	initialize()
	{
	}

}, {

	module: null,
	server: null,

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
		var def, S;

		if (fn)
		{
			def = fn();
			def.name = name;
			S = cxl.Service.extend(def);

			this.__routes.push([ 'use' , S, name ]);
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
		this.__routes.push([ 'use', middleware ]);
		return this;
	}

	/**
	 * Add new route. Order matters.
	 */
	route(/*method, path, fn*/)
	{
		this.__routes.push(arguments);
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
		console.error(colors.red(this.name + ' ' + msg));
		if (msg instanceof Error)
			console.log(msg.stack);
	}

	extend(prop)
	{
		return _.extend(this, prop);
	}

	// TODO add validation
	_loadRoute(def)
	{
		var method = def[0];

		if (def[1].prototype instanceof cxl.Service)
		{
			var service = this.__services[def[2]] = new def[1](
				this
			);
			this.server.use(service.middleware);
		}
		else if (def[2])
			this.server[method](def[1], def[2].bind(this));
		else
			this.server[method](def[1].bind(this));
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

	__services: null,
	__routes: null,

	__config: null,
	__run: null

}, {

});


module.exports = cxl;

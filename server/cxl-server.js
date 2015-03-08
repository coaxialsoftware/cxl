

var
	_ = require('lodash'),
	express = require('express'),
	colors = require('colors/safe'),
	pathToRegexp = require('path-to-regexp'),

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

cxl.Route = cxl.define(class Route {

	constructor(options)
	{
		if (typeof(options)==='string')
			this.path = options;
		else
			_.extend(this, options);
	}

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
		var m = this.regex.exec(path);

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

		_.extend(this, defaults, options);

		this.route = new cxl.Route(options.route ||
			('/' + this.name + '/:id?'));

		this.initialize();
	}

	__parse(result)
	{
		var response;

		if (this.parse)
		{
			response = (typeof(this.parse)==='string') ?
				result.get(this.parse) :
				this.parse(result);
		} else
			response = result.toJSON();

		return response || {};
	}

	__query(req)
	{
	var
		model = new this.model(),
		id = req.params[model.idAttribute],
		cb = this[req.method].bind(this, req, model),
		promise
	;
		if (id)
			model.set(model.idAttribute, id);

		if (this.query)
			promise = this.query(req, model);

		return promise ? promise.then(cb) : cb();
	}

	GET(req, model)
	{
		return model[model.id ? 'fetch' : 'fetchAll']({ columns: []});
	}

	POST(req, model)
	{
		return model.save(req.body);
	}

	PUT(req, model)
	{
		model.set(model.idProperty, req.params[model.idProperty]);
		return this.POST(req, model);
	}

	DELETE(req, model)
	{
		model.set(model.idProperty, req.params[model.idProperty]);
		return model.remove();
	}

	PATCH(req, model)
	{
		model.query('column', _.keys(req.params.body));
		return this.PUT(req, model);
	}

	error(res, err)
	{
		this.module.error(err);

		res.status(500).end();
	}

	handle(req, res)
	{
		this.__query(req).then(this.__parse.bind(this))
			.then(res.send.bind(res), this.error.bind(this, res))
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
	 *
	 */
	query: null,

	/**
	 * HTTP Methods
	 * @default cxl.Service.defaults.methods
	 */
	methods: null

}, {

	defaults: {
		methods: [ 'GET', 'POST', 'PUT', 'DELETE', 'PATCH' ]
	}

});

cxl.Module = cxl.define(class Module {

	constructor(name)
	{
		this.name = name;
		this.__services = {};
		this.__models = {};

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
					def = fn(me);

					if (!def)
						me.error('Invalid service definition');
					if (!def.model)
						def.model = me.model(name);
					if (!def.model.prototype.tableName)
						def.model.prototype.tableName = name;

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

	model(name, fn)
	{
		if (fn)
		{
			this.__models[name] = fn;

			return this;
		}

		return this.__models[name];
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

		if (this.db)
			this._loadDatabase();

		_.each(this.__models, this._loadModel, this);
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

	_loadDatabase()
	{
		var knex = require('knex')({
			client: 'pg',
			connection: this.db
		});

		this.bookshelf = require('bookshelf')(knex);
	}

	// TODO add validation
	_loadRoute(def)
	{
		var args = _.result(def, 'args');

		this.server[def.fn].apply(this.server, args);
	}

	_loadModel(def, name)
	{
		this.__models[name] = this.bookshelf.Model.extend(def.call(this, this));
	}

}, {

	// knex database connection settings
	db: null,
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
	__models: null,

	__config: null,
	__run: null

}, {

});

// Add to globals so models can be shared by server and client.
module.exports = global.cxl = cxl;

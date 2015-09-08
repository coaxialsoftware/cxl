
"use strict";

var
	_ = require('lodash'),
	express = require('express'),
	colors = require('colors/safe'),
	pathToRegexp = require('path-to-regexp'),
	path=require('path'),

	__modules = {}
;

function cxl(module)
{
	return __modules[module] ||
		(__modules[module] = new cxl.Module(module));
}

_.extend(cxl, {

	/**
	 * Enable debug module
	 */
	enableDebug: function()
	{
		cxl.debug = true;
		require('./cxl-server-debug');
	},

	static: function(a, b)
	{
		if (typeof(a)==='string')
			a = path.normalize(a);

		return express.static.call(this, a, b);
	},
	
	hrtime: function()
	{
		var time = process.hrtime();
		return time[0] + (time[1]/1e9);
	},
	
	formatTime(time, time2)
	{
		if (time2===undefined)
			time2 = cxl.hrtime();
		
	var
		s = time2-time,
		str = s.toFixed(4) + 's'
	;

		// Color code based on time, 
		return s > 0.1 ? (s > 0.5 ? colors.red(str) : colors.yellow(str)) : str;
	},

	extend: _.extend.bind(_),

	log: function(msg, module, method)
	{
	var
		single = typeof(msg)==='string' ?
			(module || colors.cyan('cxl')) + ' ' + msg : msg
	;
		console[method || 'log'](single);

		return cxl;
	},
	
	/**
	 * Defines a class
	 *
	 * @param {class|function} A Class or function
	 * @param {object} prop Properties
	 * @param {object} static_prop Static Properties
	 */
	define: function(A, prop, static_prop)
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
		this.module = module;

		_.extend(this, options);

		this.route = new cxl.Route(options.route);

		if (this.initialize)
			this.initialize();
	}

	middleware(req, res, next)
	{
		if (this[req.method])
			return this[req.method](req, res);

		next();
	}

});

cxl.Logger = function(prefix)
{
	var obj = function(msg) {
		console.log(`${obj.prefix} ${msg}`);
	};
	
	obj.prefix = prefix;
	obj.error = function(msg) {
		console.error(colors.red(`${obj.prefix} ${msg}`));
	};
					  
	obj.dbg = function(msg) {
		if (cxl.debug)
			obj(msg);
	};
	
	obj.operation = function(msg, fn, scope)
	{
	var
		t = cxl.hrtime(),
		result = fn.call(scope),
		done = function() { obj(`${msg} (${cxl.formatTime(t)})`); }
	;
		if (result && result.then)
			result = result.then(function(res) {
				done();
				return res;
			});
		else
			done();
		
		return result;
	};
	
	return obj;
};

cxl.EventListener = {
	
	__listeners: null,
	
	stopListening: function(obj, ev, callback)
	{
		_.filter(this.__listeners, {
			obj: obj, ev: ev, callback: callback
		}).each(function(l) {
			l.obj.off(l.ev, l.fn);
		});
		
		return this;
	},
	
	listenTo: function(obj, ev, callback)
	{
	var
		l = this.__listeners || (this.__listeners=[]),
		fn = callback.bind(this)
	;
		obj.on(ev, fn);
		l.push({ obj: obj, ev: ev, callback: callback, fn: fn });
		
		return this;
	}
	
};

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
	 * Helper function
	 */
	operation(msg, fn)
	{
	var
		me = this,
		t = cxl.hrtime(),
		result = fn.call(this),
		cb = function() {
			me.log(msg + ` (${cxl.formatTime(t)})`);
		}
	;
		if (result && result.then)
			result.then(cb);
		else
			cb();
		
		return this;
	}

	createServer()
	{
		this.server = express();
		return this;
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
	 *
	 * @param {string|function} fn Function to execute or method name. It will
	 *                             be executed in the module's context.
	 */
	route(method, path, fn)
	{
		if (typeof(fn)==='string')
			fn = this[fn];

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

		if (this.server && !this.server.started)
			this.startServer();

		_.invoke(this.__run, 'call', this);
	}

	onServerStart()
	{
		var a = this.__listener.address();

		if (!this.port)
			this.port = a.port;

		this.log('Listening to ' + a.address + ':' + a.port);
	}

	onServerError(e)
	{
		if (e.code==='EACCES')
			this.error('Could not start server in ' +
				this.host + ':' + this.port +
				'. Make sure the host and port are not already in use.'
			);
		this.error(e);
	}

	startServer()
	{
		var l = this.__listener = this.server.listen(this.port, this.host,
			this.onServerStart.bind(this));

		this.server.started = true;

		l.on('error', this.onServerError.bind(this));
	}

	log(msg)
	{
		cxl.log(msg, this.logColor ?
			colors[this.logColor](this.name) : this.name);
		return this;
	}

	error(msg)
	{
		cxl.log(colors.red('ERROR ' + msg), colors.red(this.name), 'error');

		if (msg instanceof Error)
			console.error(msg.stack);
	}

	/**
	 * Like cxl.log but only in debug mode.
	 */
	dbg()
	{
	}

	extend(prop)
	{
		return cxl.extend(this, prop);
	}

	// TODO add validation
	_loadRoute(def)
	{
		var args = _.result(def, 'args');

		this.server[def.fn].apply(this.server, args);
	}

}, {

	/**
	 * knex database connection settings. If it is a string it will be
	 * treated as a connection string for a postgresql server.
	 */
	db: null,
	name: null,
	logColor: 'green',

	port: 80,
	host: '',

	/**
	 * @type {express.Application}
	 */
	server: null,

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

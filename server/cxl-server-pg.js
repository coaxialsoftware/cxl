
var
	pg = require('pg'),
	Q = require('bluebird'),
	_ = require('lodash'),

	cxl = require('./cxl-server')
;

module.exports = cxl.Adapter.PG = cxl.define(class PG extends cxl.Adapter {

	constructor(options)
	{
		_.extend(this, options);
	}

	connect()
	{
		var me = this;

		return new Q(function(resolve, reject)
		{
			pg.connect(me.socket + ' ' + me.database,
				function(err, client, close) {
					if (err)
						reject(err);

					resolve(
						Q.resolve(client)
						.finally(function() { close(); })
					);
				});
		});
	}

	query(str, params)
	{
		var me = this;

		return me.connect().then(function(client) {
			return (new Q(function(resolve, reject) {

				function onQuery(err, result)
				{
					if (err)
						return reject(err);

					resolve(result);
				}

				if (typeof(str)==='string')
					client.query(str, params, onQuery);
				else
					client.query(str, onQuery);

			})).error(cxl.error);
		});
	}

}, {

	socket: null,
	database: null,

});

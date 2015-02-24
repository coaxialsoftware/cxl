
var
	_ = require('lodash'),
	cxl = require('./cxl-server')
;

module.exports = cxl.Query = cxl.define(class cxlQuery {

	constructor(query)
	{
		this.query = query;
	}

	select()
	{
	var
		r = this,
		fields = r.fields || '*',
		from = r.from,

		text = r.text || (`SELECT ${fields} FROM ${from}`),
		where, values
	;
		if (r.where)
		{
			values = this.values = [];
			where = _.reduce(r.where, function(str, val, key) {
				if (val!==undefined)
				{
					values.push(val);
					return str + `${key}=$${values.length}`;
				}

				return str;
			}, '');

			text += ' WHERE (' + where + ')';
		}
console.log(text, values);

		return {
			text: text,
			values: values
		};
	}

}, {

	values: null

});
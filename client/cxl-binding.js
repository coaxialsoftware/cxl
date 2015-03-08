
(function(cxl, _, $) {

cxl.Binding = function(options)
{
	_.extend(this, options);

	this.el = $(this.el);
	this.parseAttribute();
	this.setViewHandlers();
	this.bind();
	this._sync();
};

_.extend(cxl.Binding, {

	ATTR_REGEX: /^(.+)([\.\[].+)$/,

	setViewValue: {
		value: function(val) { this.el.val(val); },
		checkbox: function(val) { this.el.prop('checked', !!val); }
	},

	getViewValue: {
		value: function() { return this.el.val(); },
		checkbox: function() { return this.el.prop('checked'); }
	}

});

_.extend(cxl.Binding.prototype, {

	el: null,
	model: null,
	attribute: null,
	handler: null,
	regex: cxl.Binding.ATTR_REGEX,

	/// Current model value
	value: null,
	/// Current view Value
	viewValue: null,

	setViewValue: null,
	getViewValue: null,
	getter: null,
	setter: null,

	_attr: null,
	_prop: null,

	_sync: function()
	{
		this.setViewValue(this.getter());
	},

	_getter: function()
	{
		return this.model.get(this._attr);
	},

	_setter: function(val)
	{
		this.model.set(this._attr, val, {
			el: this.el, validate: true
		});
	},

	setViewHandlers: function()
	{
	var
		setter='value',
		getter='value',
		type = this.el.attr('type')
	;

		if (!this.setViewValue)
		{
			if (type==='checkbox')
				setter = 'checkbox';

			this.setViewValue = cxl.Binding.setViewValue[setter];
		}

		if (!this.getViewValue)
		{
			if (type==='checkbox')
				getter = 'checkbox';
			this.getViewValue = cxl.Binding.getViewValue[getter];
		}
	},

	parseAttribute: function()
	{
		/*jshint evil:true*/
		var m = this.regex.exec(this.attribute);

		this._attr = m && m[1] || this.attribute;
		this._prop = m && m[2];

		if (!this.getter)
			this.getter = this._prop ? new Function('try { return this.model.get("' +
				this._attr + '")' + this._prop +
				'; } catch(e) { return null; }') : this._getter;

		if (!this.setter)
			this.setter = this._prop ? new Function('val', 'var attr=_.extend({}, this.model.get("' +
				this._attr + '")); attr' + this._prop +
				'=val; this._setter(attr);') : this._setter;
	},

	unbind: function()
	{
		this.model.off('change:' + this._attr,
			this.onModelChange, this);
		this.el.off('change', this._ovc);
	},

	bind: function()
	{
		this.model.on('change:' + this._attr,
			this.onModelChange, this);
		this._ovc = this.onViewChange.bind(this);
		this.el.on('change input', this._ovc);
	},

	onModelChange: function()
	{
		this.value = this.getter();
		this.setViewValue(this.value);
	},

	onViewChange: function()
	{
		var val = this.getViewValue();

		if (this.viewValue!==val)
		{
			this.setter(val);
			this.viewValue = val;
		}
	}

});

})(this.cxl, this._, this.jQuery);


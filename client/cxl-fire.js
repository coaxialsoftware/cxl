
(function(cxl, _) {

/**
 * Two way Binding for firebase objects.
 *
 * options:
 *
 * el   jQuery element
 * ref  Firebase reference
 * validate Validation function or cxl.validate configuration object.
 *
 */
cxl.Binding = function(options)
{
	this.el = options.el;
	this.ref = options.ref;
	this.validate = _.isFunction(options.validate) ?
		options.validate : cxl.validator(options.validate);

	this._onComplete = this.onComplete.bind(this);
	this.setViewHandlers();
	this.bind();

	if (this.el instanceof cxl.View)
		this.bindContainer();
};

cxl.bind = function(op)
{
	return new cxl.Binding(op);
};

_.extend(cxl.Binding, {

	setView: {
		value: function(val) { return this.el.val(val); },
		checkbox: function(val)
		{
			var value = this.el.attr('value') || true;
			return this.el.prop('checked', value===val);
		}
	},

	getView: {
		value: function() { return this.el.val(); },
		checkbox: function()
		{
			var val = this.el.attr('value') || true;
			return this.el.prop('checked') ? val : false;
		}
	}

});

_.extend(cxl.Binding.prototype, {

	/**
	 * jQuery element.
	 */
	el: null,

	/**
	 * Firebase reference
	 */
	ref: null,

	/**
	 * Current Model value
	 */
	value: null,

	/**
	 * Current View value
	 */
	viewValue: null,

	/**
	 * Validator Function. If an object is passed it will
	 * be passed to cxl.validator() and the resulting function
	 * will be used.
	 */
	validate: null,

	setViewHandlers: function()
	{
	var
		type = this.el instanceof cxl.View ? 'view' : this.el.attr('type')
	;
		this.setViewValue = cxl.Binding.setView[
			type==='checkbox' ? 'checkbox': 'value'
		];
		this.getViewValue = cxl.Binding.getView[
			type==='checkbox' ? 'checkbox': 'value'
		];
	},

	unbind: function()
	{
		this.ref.off('value', this.onModelChange, this);
		this.ref.off('child_added');
		this.ref.off('child_removed');
		this.ref.off('child_moved');
		this.el.off('change', this._ovc);
	},

	bind: function()
	{
		this.ref.on('value', this.onModelChange, this);
		this._ovc = this.onViewChange.bind(this);
		this.el.on('change input', this._ovc);
	},

	bindContainer: function()
	{
		var el = this.el;

		this.ref.on('child_added', function(snap, prev) {
			el.trigger('add', snap, prev);
		});

		this.ref.on('child_removed', function(snap) {
			el.trigger('remove', snap);
		});

		this.ref.on('child_moved', function(snap, prev) {
			el.trigger('move', snap, prev);
		});
	},

	onModelChange: function(snapshot)
	{
		this.value = snapshot.val();
		this.setViewValue(this.value);
		this.sync();
	},

	onViewChange: function()
	{
		var val = this.getViewValue(), err;

		if (this.validate)
		{
			err = this.validate(val);
			if (err)
				return this.sync(err);
		}

		if (this.value!==val)
			this.ref.set(val, this._onComplete);
		else if (this.viewValue!==val)
			this.sync();

		this.viewValue=val;
	},

	// Binded handler
	_onComplete: null,

	onComplete: function(err)
	{
		if (err)
			this.sync(err);
	},

	sync: function(err)
	{
		this.el.trigger("sync", err);

		return this;
	}


});

cxl.validator = function(op)
{
	return function(val)
	{
		var rule, fn;

		for (rule in op)
		{
			fn = cxl.Validators[rule];

			if (fn && fn(val, op[rule])!==true)
			{
				return {
					code: 'PERMISSION_DENIED',
					validator: rule
				};
			}
		}
	};
};


cxl.Validators = {

	json: function(value)
	{
		try {
			if (value!=="")
				JSON.parse(value);
		} catch(e) {
			return false;
		}
		return true;
	},

	required: function(value)
	{
		return (value!==undefined && value!==null && value!=="");
	},

	max: function(value, max)
	{
		return +value <= max;
	},

	min: function(value, min)
	{
		return +value >= min;
	},

	maxlength: function(value, max)
	{
		return value && _.has(value, 'length') && value.length<=max;
	},

	minlength: function(value, min)
	{
		return value && _.has(value, 'length') && value.length>=min;
	},

	pattern: function(value, regex)
	{
		return regex.test(value);
	}

};

/**
 * Supported tags:
 *
 * cxl-view   Initializes a cxl.View, parameters passed in data
 *            attributes.
 * cxl-bind   Creates a cxl.Binding object
 *            [type:]ref or @attr:ref
 *
 */
cxl.template = function cxlTemplate(content)
{
	return function()
	{
	var
		container = document.createElement('DIV')
	;
		container.innerHTML = content;
		return container;
	};
};


})(this.cxl, this._);

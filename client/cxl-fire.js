
(function(cxl, _, $) {

/**
 * Two way Binding for firebase objects.
 *
 * options:
 *
 * el          jQuery element
 * ref         Firebase reference
 * validate    Validation function or cxl.validate configuration object.
 * type        Type of binding see cxl.Binding.setView and getView.
 * attribute   attribute name for type "attribute"
 *
 */
cxl.Binding = function(options)
{
	this.el = options.el;
	this.ref = options.ref;
	this.type = options.type;
	this.attribute = options.attribute;

	this.validate = _.isFunction(options.validate) ?
		options.validate : cxl.validator(options.validate);

	this._onComplete = this.onComplete.bind(this);
	this.setViewHandlers();
	this.bind();
};

_.extend(cxl.Binding, {

	setView: {
		attribute: function(val)
			{ this.el.attr(this.attribute, val); },
		'if': function(val)
		{
			if (!this.marker)
			{
				this.marker = $(document.createComment('bind'));
				this.el.before(this.marker);
			}

			if (val)
				this.marker.insertAfter(this.el);
			else
				this.el.detach();
		},

		content: function(val) {
			this.el.html(val);
		},
		value: function(val) { return this.el.val(val); },
		checkbox: function(val)
		{
			var value = this.el.attr('value') || true;
			return this.el.prop('checked', value===val);
		}
	},

	getView: {
		attribute: function() { return this.el.attr(this.attribute); },
		'if': function() { return this.value; },
		value: function() { return this.el.val(); },
		content: function() {
			return this.value;
		},
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
		tagName = this.el.prop('tagName'),
		type = this.type || (/^INPUT|TEXTAREA|SELECT$/.test(tagName) ?
				(this.el.attr('type')==='checkbox' ? 'checkbox' : 'value') :
				'content')
	;
		this.setViewValue = cxl.Binding.setView[type];
		this.getViewValue = cxl.Binding.getView[type];
	},

	unbind: function()
	{
		this.ref.off('value', this.onModelChange, this);
		this.ref.off('child_added');
		this.ref.off('child_removed');
		this.ref.off('child_moved');
		this.el.off('change', this._ovc);
		this.el.removeData('cxl.bind');
	},

	bind: function()
	{
		this.ref.on('value', this.onModelChange, this);
		this._ovc = this.onViewChange.bind(this);
		this.el.on('change input', this._ovc);
		this.el.data('cxl.bind', this);
		this.bindContainer();
	},

	bindContainer: function()
	{
		var el = this.el;

		this.ref.on('child_added', function(snap, prev) {
			el.trigger('add', [snap, prev]);
		});

		this.ref.on('child_removed', function(snap) {
			el.trigger('remove', snap);
		});

		this.ref.on('child_moved', function(snap, prev) {
			el.trigger('move', [snap, prev]);
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
		this.el.trigger("sync", [err, this.value]);

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
 * Binds DOM template to a Firebase ref.
 *
 * @param el   JQuery Element or selector.
 * @param ref  Firebase reference to bind template to.
 *
 * &="ref"    Creates a cxl.Binding object
 *            [type:]ref or @attr:ref
 */
cxl.Template = function(el, ref)
{
	// TODO OPTIMIZE
	this.el = typeof(el)==='string' ?
		$(window.document.createDocumentFragment())
			.append(_.template(el)(ref)) : $(el);
	this.bind(ref);
};

var
	bindRegex = /^([#@])?(?:([^\s>"'=]+):)?(.+)/
;

_.extend(cxl.Template.prototype, {

	el: null,
	ref: null,
	bindings: null,

	unbind: function()
	{
		_.invoke(this.bindings, 'unbind');
		return this;
	},

	bind: function(ref)
	{
	var
		bindings = this.bindings = [],
		fragment = this.el[0]
	;
		ref = ref ? (this.ref=ref) : this.ref;

		// TODO optimize this, clean up
		_.each(fragment.querySelectorAll('[\\&]'), function(el) {
		var
			prop = el.getAttribute('&').split(' '),
			$el = $(el)
		;
			_.each(prop, function(val) {
				var b = bindRegex.exec(val), type, attr, r, view;

				r = (ref && b[3]) ? ref.child(b[3]) : ref;

				if (b[1]==='@')
				{
					type = 'attribute';
					attr = b[2];
				} else if (b[1]==='#')
				{
					r = b[2] ? ref.child(b[3]) : ref;
					view = cxl.view(b[2] || b[3]).create({ el: $el, ref: r });
					type = view.bindingType || 'value';
				} else
					type = b[2];

				if (r)
					bindings.push(new cxl.Binding({
						el: $el,
						ref: r,
						type: type,
						attribute: attr
					}));
			});
		});

		return this;
	}

});

cxl.binding = function(op) { return new cxl.Binding(op); };
cxl.template = function(el, ref) { return new cxl.Template(el, ref); };

})(this.cxl, this._, this.jQuery);

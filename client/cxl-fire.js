
(function(cxl, _, $) {

/**
 * Two way Binding for firebase objects.
 *
 * options:
 *
 * el          cxl.View
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

	this._onComplete = this.onComplete.bind(this);
	this.bind();
};

/*
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
*/

_.extend(cxl.Binding.prototype, {

	/**
	 * cxl.View element.
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

	/*setViewHandlers: function()
	{
	var
		tagName = this.el.prop('tagName'),
		type = this.type || (/^INPUT|TEXTAREA|SELECT$/.test(tagName) ?
				(this.el.attr('type')==='checkbox' ? 'checkbox' : 'value') :
				'content')
	;
		this.setViewValue = cxl.Binding.setView[type];
		this.getViewValue = cxl.Binding.getView[type];
	},*/

	unbind: function()
	{
		this.ref.off('value', this.onModelChange, this);
		this.ref.off('child_added');
		this.ref.off('child_removed');
		this.ref.off('child_moved');
	},

	bind: function()
	{
	var
		view = this.el,
		r = this.ref
	;
		r.on('value', this.onModelChange, this);

		if (view.addChild)
			this.ref.on('child_added', view.addChild, view);
		if (view.removeChild)
			this.ref.on('child_removed', view.removeChild, view);
		if (view.moveChild)
			this.ref.on('child_moved', view.moveChild, view);
	},

	onModelChange: function(snapshot)
	{
		this.value = snapshot.val();
		this.el.val(this.value);
	},

	set: function(val)
	{
		if (this.value!==val)
			this.ref.set(val, this._onComplete);
	},

	// Binded handler
	_onComplete: null,

	onComplete: function(err)
	{
		if (err && this.el.error)
			this.el.error(err);
	}

});



cxl.CompiledTemplate = function(el, ref)
{
	this.bindings = [];
	this.el = el;
	// TODO see if we can remove ref
	this.ref = ref;
};

_.extend(cxl.CompiledTemplate.prototype, {

	bindings: null,
	el: null,
	ref: null,

	destroy: function()
	{
		_.invoke(this.bindings, 'destroy');
		this.bindings = null;
	}

});

/**
 * Binds DOM template to a Firebase ref.
 *
 * &="ref"    Creates a cxl.Binding object
 *            [type:]ref or @attr:ref
 */
cxl.TemplateCompiler = function()
{
	this.directives = {};
};

_.extend(cxl.TemplateCompiler.prototype, {

	directives: null,

	bindRegex: /([\.@])?(?:([^:\s>"'=]+))(?::([^\s]+))?(?:\s+|$)/g,

	/*bindView: function(bind, name, ref)
	{
		bind.ref = ref;
		var view = cxl.view(name).create({
			el: bind.el,
			ref: ref
		});

		if (view.initializeBind)
			view.initializeBind(bind);
		else
			bind.type = view.bindingType || 'value';

		return view;
	},

	bindAttribute: function(bind, name)
	{
		bind.type = 'attribute';
		bind.attribute = name;
	},
	*/
	bindElement: function(el, b, result)
	{
	var
		ref = result.ref,
		directive, parameter,
		binding = {
			ref: (ref && b[3]) ? ref.child(b[3]) : ref
		}
	;
		if (b[1]==='@')
		{
			directive = 'attribute';
			parameter = b[2];
		}
		else if (b[1]==='.')
		{
			directive = 'class';
			parameter = b[2];
		}
		else
			directive = b[2];

		result.bindings.push(
			this.directives[directive](el,
				binding.ref && binding, parameter)
		);
	},

	parseBinding: function(result, el)
	{
	var
		prop = el.getAttribute('&'),
		$el = $(el),
		parsed
	;
		// TODO do we need this lastIndex reset?
		this.bindRegex.lastIndex = 0;
		while ((parsed = this.bindRegex.exec(prop)))
			this.bindElement($el, parsed, result);
	},

	compile: function(el, ref)
	{
		if (typeof(el)==='string')
			el = $(document.createDocumentFragment()).append(el);

		var result = new cxl.CompiledTemplate(el, ref);

		//el.find('[\\&]').each(this.parseBinding.bind(this, result));
		_.each(el[0].querySelectorAll('[\\&]'), this.parseBinding.bind(this, result));

		return result;
	}

});

cxl.binding = function(op) { return new cxl.Binding(op); };
cxl.templateCompiler = new cxl.TemplateCompiler();
cxl.compile = function(el, ref) { return cxl.templateCompiler.compile(el, ref); };

})(this.cxl, this._, this.jQuery);

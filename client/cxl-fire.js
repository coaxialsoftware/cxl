
(function(cxl, _) {

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



cxl.CompiledTemplate = function(el, ref, local)
{
	this.bindings = [];
	this.el = el;
	this.local = local;
	// TODO see if we can remove ref
	this.ref = ref;
};

_.extend(cxl.CompiledTemplate.prototype, {

	bindings: null,
	// Compiled element
	el: null,
	// Firebase reference
	ref: null,
	// Local directives
	local: null,

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

	// TODO measure performance
	this.createFragment = cxl.support.createContextualFragment ?
		this.createFragmentRange : (cxl.support.template ?
		this.createFragmentTemplate : this.createFragmentLegacy);
};

_.extend(cxl.TemplateCompiler.prototype, {

	directives: null,

	bindRegex: /([#\.@])?(?:([^:\s>"'=]+))(?::([^\s]+))?(?:\s+|$)/g,

	createFragment: null,

	createFragmentRange: function(content)
	{
		return document.createRange().createContextualFragment(content);
	},

	createFragmentTemplate: function(content)
	{
		var tpl = document.createElement('template');
		tpl.innerHTML = content;
		return tpl.content;
	},

	createFragmentLegacy: function(content)
	{
		var frag = document.createDocumentFragment(),
			tmp = document.createElement('body'), child;
		tmp.innerHTML = content;

		while ((child = tmp.firstChild)) {
			frag.appendChild(child);
		}

		return frag;
	},

	bindElement: function(el, b, result)
	{
	var
		directive,
		ref = (result.ref && b[3]) ?
			result.ref.child(b[3]) : result.ref,
		options = { el: el, binding: ref && { ref: ref } }
	;
		if (b[1]==='@')
		{
			directive = this.directives.attribute;
			options.parameters = b[2];
		}
		else if (b[1]==='.')
		{
			directive = this.directives.class;
			options.parameters = b[2];
		}
		else if (b[1]==='#')
		{
			directive = result.local[b[2]];
		}
		else
			directive = this.directives[b[2]];

		result.bindings.push(directive(options));
	},

	parseBinding: function(result, el)
	{
	var
		prop = el.getAttribute('&'),
		parsed
	;
		el.removeAttribute('&');

		// TODO do we need this lastIndex reset?
		this.bindRegex.lastIndex = 0;
		while ((parsed = this.bindRegex.exec(prop)))
			this.bindElement(el, parsed, result);
	},

	compile: function(el, ref, local)
	{
		if (typeof(el)==='string')
			el = this.createFragment(el);
	var
		result = new cxl.CompiledTemplate(el, ref, local),
		match
	;
		while ((match = el.querySelector('[\\&]')))
			this.parseBinding(result, match);

		return result;
	}

});

cxl.binding = function(op) { return new cxl.Binding(op); };
cxl.templateCompiler = new cxl.TemplateCompiler();
cxl.compile = function(el, ref, local) { return cxl.templateCompiler.compile(el, ref, local); };

})(this.cxl, this._);

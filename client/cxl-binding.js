
(function(cxl, _) {

/**
 * Two way Binding.
 */
cxl.Binding = function(options)
{
	_.extend(this, options);

	this.onComplete = this._onComplete.bind(this);
	this.bind();
};

_.extend(cxl.Binding.prototype, {

	/**
	 * Observable object A.
	 */
	refA: null,

	/**
	 * Observable object B.
	 */
	refB: null,

	/**
	 * Event to listen to for refA
	 */
	eventA: 'value',

	/**
	 * Event to listen to for refB
	 */
	eventB: 'value',

	/**
	 * Bind only once
	 */
	once: false,

	unbind: function()
	{
		this.refA.off(this.eventA, this.onRefA, this);
		this.refB.off(this.eventB, this.onRefB, this);
	},

	bind: function()
	{
		var method = this.once ? 'once': 'on';

		this.refA[method](this.eventA, this.onRef.bind(this, this.refB));
		this.refB[method](this.eventB, this.onRef.bind(this, this.refA));
	},

	destroy: function()
	{
		this.unbind();
	},

	onRef: function(dest, ref)
	{
		var val = ref.val();

		if (this.value !== val)
		{
			this.value = val;
			dest.set(val, this.onComplete);
		}
	},

	// Binded handler
	onComplete: null,

	_onComplete: function(err)
	{
		if (err)
		{
			if (this.refA.trigger)
				this.refA.trigger('error', err);
			if (this.refB.trigger)
				this.refB.trigger('error', err);
		}
	}

});


cxl.CompiledTemplate = function(el, scope)
{
	this.bindings = [];
	this.el = el;
	this.scope = scope;
};

_.extend(cxl.CompiledTemplate.prototype, {

	bindings: null,

	// Compiled DOM element
	el: null,

	// Local scope {cxl.View} optional
	scope: null,

	destroy: function()
	{
		_.invoke(this.bindings, 'unbind');
		this.scope = this.el = this.bindings = null;
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
	shortcuts: {
		'#': 'local',
		'.': 'class',
		'@': 'attribute',
		'&': 'ref'
	},

	bindRegex: /([#\.@\&]?)([^\(:\s>"'=]+)(?:\(([^\)]+)\))?(?:(::?)([#\.@\&]?)([^\(:\s>"'=]+)(?:\(([^\)]+)\))?)?/g,

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

	getRef: function(shortcut, name, param, el, scope)
	{
	var
		directive = this.shortcuts[shortcut]
	;
		if (directive)
			param = name;

		return this.directives[directive || name](el, param, scope);
	},

	bindElement: function(el, b, result)
	{
	var
		refA = this.getRef(b[1], b[2], b[3], el, result.scope),
		once = b[4]==='::',
		refB
	;
		if (b[4])
		{
			refB = this.getRef(b[5], b[6], b[7], el, result.scope);
			result.bindings.push(new cxl.Binding({
				refA: refA, refB: refB, once: once
			}));
		} else if (refA)
			result.bindings.push(refA);
	},

	parseBinding: function(result, el)
	{
	var
		prop = el.getAttribute('&'),
		parsed
	;
		el.removeAttribute('&');

		// TODO do we need this lastIndex reset?
		while ((parsed = this.bindRegex.exec(prop)))
			this.bindElement(el, parsed, result);
	},

	compile: function(el, scope)
	{
		if (typeof(el)==='string')
			el = this.createFragment(el);
	var
		result = new cxl.CompiledTemplate(el, scope),
		match
	;
		//TODO optimize
		while ((match = el.querySelector('[\\&]')))
			this.parseBinding(result, match);

		return result;
	}

});

cxl.binding = function(op) { return new cxl.Binding(op); };
cxl.templateCompiler = new cxl.TemplateCompiler();
cxl.compile = function(el, local) { return cxl.templateCompiler.compile(el, local); };

cxl.directive('ref', function(el, param, scope) {
	return param ? scope.child(param) : scope;
});

cxl.directive('class', {
	set: function(val) { this.$el.toggleClass(this.parameters, val); }
});

cxl.directive('attribute', {
	set: function(val) { this.$el.attr(this.parameters, val); }
});

cxl.directive('local', function(el, param, scope) {
	return scope[param](el, param, scope);
});

cxl.directive('if', {
	initialize: function(el) {
		this.marker = document.createComment('bind');
		el.before(this.marker).detach();
	},
	set: function(v) {
		if (v.val())
			this.marker.insertAfter(this.el);
		else
			this.$el.detach();
	}
});

cxl.directive('event', {
	initialize: function(el, event, scope)
	{
		scope.on(event, function(ev) {
			this.value = ev;
			this.trigger('value', this);
		}, this);
	}
});


})(this.cxl, this._);

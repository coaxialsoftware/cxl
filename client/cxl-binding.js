
(function(cxl, _, $) {

/**
 * Two way Binding.
 */
cxl.Binding = function(options)
{
	this.refA = options.refA;
	this.refB = options.refB;
	this.once = options.once;

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
	 * Bind only once
	 */
	once: false,

	unbind: function()
	{
		this.refA.off('value', this.onRefA, this);
		this.refB.off('value', this.onRefB, this);
		this.refA = this.refB = null;
	},

	bind: function()
	{
		var method = this.once ? 'once': 'on';

		this.refA[method]('value', this.onRef.bind(this, this.refB));
		this.refB[method]('value', this.onRef.bind(this, this.refA));
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
			if (this.refB && this.refB.trigger)
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
 * Creates References and Bindings for a DOM element.
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

	bindRegex: /(?:([#\.@\&]?)([^\(:\s>"'=]+)(?:\(([^\)]+)\))?(?:(::?)([#\.@\&]?)([^\(:\s>"'=]+)(?:\(([^\)]+)\))?)?)+/,

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

		this.bindRegex.lastIndex = 0;
		parsed = this.bindRegex.exec(prop);

		while (parsed.length)
		{
			this.bindElement(el, parsed, result);
			parsed.splice(0, 8);
		}
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
cxl.compile = function(el, scope) { return cxl.templateCompiler.compile(el, scope); };

cxl.directive('class', {
	render: function(val) { this.$el.toggleClass(this.parameters, val); }
});

cxl.directive('const', {
	on: function()
	{
		cxl.View.prototype.on.apply(this, arguments);
		this.set(_.result(this.parent, this.parameters));
	}
});

cxl.directive('attribute', {
	render: function(val) { this.$el.attr(this.parameters, val); }
});

cxl.directive('local', function(el, param, scope) {
	return scope[param](el, param, scope);
});

cxl.directive('call', {
	set: function() {
		this.parent[this.parameters].apply(this.parent, arguments);
	}
});

cxl.directive('html', {
	render: function(val)
	{
		if (this.parameters && this.parent)
			val = this.parent[this.parameters](val);

		this.$el.html(val);
	}
});

cxl.directive('if', {
	initialize: function(el) {
		this.marker = $(document.createComment('bind'));
		el.before(this.marker).detach();
	},
	render: function(val) {
		if (val)
			this.marker.after(this.el);
		else
			this.$el.detach();
	}
});

cxl.directive('unless', {
	initialize: function(el) {
		this.marker = $(document.createComment('bind'));
		el.before(this.marker);
	},
	render: function(val) {
		if (val)
			this.$el.detach();
		else
			this.marker.after(this.el);
	}
});

// Binds to View DOM element event
cxl.directive('on', {
	initialize: function(el, event)
	{
		var me = this;

		el.on(event, function(ev) {
			me.value = arguments;
			me.event = ev;
			me.trigger('value', me);
		});
	}
});

// Binds to View event
cxl.directive('event', {
	initialize: function(el, event, scope)
	{
		scope.on(event, function(ev) {
			this.value = arguments;
			this.event = ev;
			this.trigger('value', this);
		}, this);
	}
});

cxl.directive('toggleClass', {
	render: function() {
		this.$el.toggleClass(this.parameters);
	}
});

cxl.directive('compile', function(el, param, scope)
{
	var newScope = param ? _.result(scope, param) : scope;
	cxl.compile(el, newScope);
});

})(this.cxl, this._, this.jQuery);

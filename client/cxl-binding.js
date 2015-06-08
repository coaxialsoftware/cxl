
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
	this.templates = {};

	// TODO measure performance
	this.createFragment = cxl.support.createContextualFragment ?
		this.createFragmentRange : (cxl.support.template ?
		this.createFragmentTemplate : this.createFragmentLegacy);
};

_.extend(cxl.TemplateCompiler.prototype, {

	directives: null,
	templates: null,

	shortcuts: {
		'#': 'local',
		'.': 'class',
		'@': 'attribute'
	},

	bindRegex: /(?:([#\.@\&]?)([^\(:\s>"'=]+)(?:\(([^\)]+)\))?(?:(::?)([#\.@\&]?)([^\(:\s>"'=]+)(?:\(([^\)]+)\))?)?)+/,

	registerShortcut: function(key, directive)
	{
		this.shortcuts[key] = directive;
	},

	registerTemplate: function(id, content)
	{
		return (this.templates[id] = content);
	},

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
		directive = this.shortcuts[shortcut],
		ref
	;
		if (directive)
			param = name;
		else
			directive = name;

		ref = this.directives[directive];

		if (!ref)
			throw new Error('Directive ' + directive + ' not found.');

		return ref(el, param, scope);
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

cxl.template = function(id)
{
	return cxl.templateCompiler.templates[id] ||
		(cxl.templateCompiler.registerTemplate(id, document.getElementById(id).innerHTML));
};

//
// CSS Directives
//
cxl.directive('class', {
	update: function(val, el, cls) { el.toggleClass(cls, val); }
});

cxl.directive('toggleClass', {
	set: function(val, el, cls) { el.toggleClass(cls); }
});

//
// Attribute Directives
//

/**
 * Sets element attribute value
 */
cxl.directive('attribute', {
	update: function(val) { this.$el.attr(this.parameters, val); }
});

//
// View Directives
//

/**
 * Runs Local Directive
 */
cxl.directive('local', function(el, param, scope) {
	var fn = _.get(scope, param);
	return fn.call(scope, el, param, scope);
});

function resultDirective(fn)
{
	return new cxl.View({
		on: function()
		{
			cxl.View.prototype.on.apply(this, arguments);
			this.set(fn());
		}
	});
}

cxl.directive('const', function(el, param, scope) {
	return resultDirective(_.constant(_.result(scope, param)));
});

cxl.directive('result', function(el, param, scope)
{
	return resultDirective(_.result.bind(_, scope, param));
});

cxl.directive('call', {
	set: function(val) {
		var fn = _.get(this.parent, this.parameters);
		fn.call(this.parent, val, this.$el, this.parameters);
	}
});

function viewEventDirective(el, event, scope)
{
	return new cxl.View({
		load: function()
		{
			var me = this;
			this.listenTo(scope, event, function() {
				me.set(arguments);
			});
		}
	});
}

/**
 * Binds to View event
 */
cxl.directive('event', viewEventDirective);

cxl.directive('ready', function(el, param, scope)
{
	return viewEventDirective(el, 'ready', scope);
});

//
// Navigation
//
cxl.directive('go', {
	set: function()
	{
		var fn = _.get(this.parent, this.parameters);
		cxl.go(fn.call(this.parent));
	}
});

cxl.directive('goPath', { set: function() { cxl.go(this.parameters); } });

cxl.directive('goUp', { set: function() { cxl.go('..'); } });

cxl.directive('link', function(el, param) {
	el.setAttribute('href', '#' + cxl.path(param));
});

//
// DOM Content Directives
//

function jQueryDirective(el, arg, scope, method)
{
	return new cxl.View({
		el: el,
		update: function(val, el)
		{
			if (arg && scope)
			{
				var fn = _.get(scope, arg);
				val = typeof(fn)==='function' ? fn.call(scope, val) : fn;
			}

			el[method](val);
		}
	});
}

cxl.directive('val', function(el, arg, scope) {
	return jQueryDirective(el, arg, scope, 'val');
});

cxl.directive('text', function(el, arg, scope)
{
	return jQueryDirective(el, arg, scope, 'text');
});

cxl.directive('html', function(el, arg, scope)
{
	return jQueryDirective(el, arg, scope, 'html');
});

//
// Marker Directives
//
function markerDirective(el, param, scope, def)
{
	var marker = $(document.createComment('bind'));
	el.parentNode.insertBefore(marker[0], el);

	def.el = el; def.parameters = param; def.parent = scope;
	def.marker = marker;

	return new cxl.View(def);
}

cxl.directive('if', function(el, param, scope)
{
	return markerDirective(el, param, scope, {
		load: function(el) { el.detach(); },
		update: function(val, el) {
			return val ? this.marker.after(el) : el.detach();
		}
	});
});

cxl.directive('unless', function(el, param, scope) {
	return markerDirective(el, param, scope, {
		update: function(val, el) {
			return val ? el.detach() : this.marker.after(el);
		}
	});
});

//
// DOM Events
//
function domEventDirective(el, event, scope, param, prevent)
{
	var fn = param && _.get(scope, param);

	return new cxl.View({
		el: el,
		load: function(el)
		{
			this.listenTo(el, event, function(ev) {
				if (prevent)
					ev.preventDefault();

				if (fn)
					fn.call(scope, ev);
				else
					this.set(ev);
			});
		}
	});
}

/**
 * Binds to View DOM element event.
 */
cxl.directive('on', domEventDirective);

cxl.directive('click', function(el, e, scope) {
	return domEventDirective(el, 'click', scope, e, true);
});

cxl.directive('submit', function(el, e, scope) {
	return domEventDirective(el, 'submit', scope, e, true);
});

cxl.directive('stop', function(el, event) {
	el.addEventListener(event, function(ev) {
		ev.stopPropagation();
		ev.preventDefault();
	});
});

//
// Template Directives
//

cxl.directive('compile', function(el, param, scope)
{
	var newScope = param ? _.result(scope, param) : scope;
	cxl.compile(el, newScope);
});


})(this.cxl, this._, this.jQuery);


(function(cxl, _, $) {
	
var
	templates={}
;

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
		dest.set(ref.val(), this.onComplete);
	},

	// Binded handler
	onComplete: null,

	_onComplete: function(err)
	{
		if (err)
		{
			if (this.refA && this.refA.trigger)
				this.refA.trigger('error', err);
			if (this.refB && this.refB.trigger)
				this.refB.trigger('error', err);
		}
	}

});


cxl.CompiledTemplate = function(el, scope)
{
	this.bindings = [];
	this.__digest = [];
	this.el = el;
	this.scope = scope;
	this.digest = _.debounce(this.__doDigest.bind(this), 0);
};

_.extend(cxl.CompiledTemplate.prototype, {

	bindings: null,
	__digest: null,
	digest: null,

	// Compiled DOM element
	el: null,

	// Local scope {cxl.View} optional
	scope: null,

	destroy: function()
	{
		_.invoke(this.bindings, 'unbind');
		this.scope = this.el = this.bindings = null;
	},
	
	// TODO see if this is dangerous
	valueOf: function()
	{
		return this.el;
	},
	
	__doDigest: function()
	{
	var
		digest = this.__digest,
		l = digest.length
	;
		while (l--)
			digest[l]();
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
		'$': 'id',
		'=': 'expr'
	},
	
	bindRegex: /(?:\s*([#\.@\&\$=]?)([^\(:\s>"'=]+)(?:\(([^\)]+)\))?(?:(::?)([#\.@\&=]?)([^\(:\s>"'=]+)(?:\(([^\)]+)\))?)?)/g,

	registerShortcut: function(key, directive)
	{
		this.shortcuts[key] = directive;
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

	getRef: function(shortcut, name, param, el, tpl)
	{
	var
		scope = tpl.scope,
		directive = this.shortcuts[shortcut],
		ref, result
	;
		if (directive)
			param = name;
		else
			directive = name;

		ref = this.directives[directive];

		if (!ref)
			throw new Error('Directive ' + directive + ' not found.');

		result = ref(el, param, scope);
		
		if (result && result.digest)
			tpl.__digest.push(result.digest.bind(result));
		
		return result;
	},

	bindElement: function(el, b, result)
	{
	var
		refA = this.getRef(b[1], b[2], b[3], el, result),
		once = b[4]==='::',
		refB
	;
		if (b[4])
		{
			refB = this.getRef(b[5], b[6], b[7], el, result);
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
		
		result.__doDigest();
		
		return result;
	}

});

cxl.binding = function(op) { return new cxl.Binding(op); };
cxl.templateCompiler = new cxl.TemplateCompiler();
cxl.compile = function(el, scope) { return cxl.templateCompiler.compile(el, scope); };

cxl.templateId = function(id)
{
	return templates[id] || (templates[id]=cxl.template(cxl.id(id).innerHTML));
};
	
/** Returns an underscore template function */
cxl._templateId = function(id)
{
	return templates[id] || (templates[id]=_.template(cxl.id(id).innerHTML));
};
	
cxl.template = function(str)
{
	return function(scope) {
		return cxl.compile(str, scope);
	};
};

//
// CSS Directives
//
cxl.directive('class', {
	update: function(val) { this.el.classList.toggle(this.parameters, val); }
});

cxl.directive('toggleClass', {
	set: function() { this.el.classList.toggle(this.parameters); }
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
	
cxl.directive('id', function(el, param, scope) {
	_.set(scope, param, el);
});

function resultDirective(fn)
{
	return new cxl.Emitter({
		initialize: function()
		{
			this.set(fn());
		}
	});
}
	
cxl.directive('expr', function(el, param, scope) {
	
	/* jshint evil:true */
	var fn = new Function('scope',
		'try { with(scope) { return (' + param + '); }} catch(e) { cxl.log(e); return; }');
	
	return new cxl.Emitter({
		digest: function() {
			this.set(fn(scope));
		}
	});
	
});

cxl.directive('const', function(el, param, scope) {
	var obj = _.result(scope, param);
	
	return obj instanceof cxl.Emitter ? obj : resultDirective(_.constant(_.result(scope, param)));
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
	el = $(el);
	return new cxl.Emitter({
		update: function(val)
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
function markerDirective(el, def)
{
	var marker = def.marker = $(document.createComment('bind'));
	el.parentNode.insertBefore(marker[0], el);
	def.el = el;
	def.detach = function() {
		if (this.el.parentNode)
			this.el.parentNode.removeChild(this.el);
	};

	return new cxl.Emitter(def);
}

cxl.directive('if', function(el)
{
	return markerDirective(el, {
		update: function(val) {
			return val ? this.marker.after(el) : this.detach();
		}
	});
});

cxl.directive('unless', function(el) {
	return markerDirective(el, {
		update: function(val) {
			return val ? this.detach() : this.marker.after(el);
		}
	});
});

//
// DOM Events
//
function domEventDirective(el, event, scope, param, prevent)
{
	var fn = param && _.get(scope, param);

	return new cxl.Emitter({
		initialize: function()
		{
			this.listenTo(el, event, function(ev) {
				if (prevent)
				{
					ev.preventDefault();
					ev.stopPropagation();
				}

				if (fn)
					fn.call(scope, ev);
				
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

/**
 * Must be attached to form.
 */
cxl.directive('submit', function(el, e, scope) {
	return domEventDirective(el, 'submit', scope, e, true);
});
	
cxl.directive('prevent', function(el, event) {
	el.addEventListener(event, function(ev) {
		ev.preventDefault();
	});
});

cxl.directive('stop', function(el, event) {
	el.addEventListener(event, function(ev) {
		ev.stopPropagation();
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

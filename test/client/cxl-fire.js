
(function() {

var
	fb = new Firebase('https://cxl-test.firebaseio.com')
;

QUnit.module('cxl-fire');

QUnit.test('cxl.Binding#constructor', function(a) {
var
	done = a.async(),
	el = new cxl.View(),
	ref = fb.child('cxl-binding/string'),
	b = cxl.binding({ el: el, ref: ref })
;
	a.ok(b);
	a.equal(el.val(), null);

	ref.on('value', function() {
		a.equal(el.val(), 'string');
		b.unbind();
		done();
	});
});

/*QUnit.test('cxl.Binding#setView checkbox', function(a) {
var
	done = a.async(),
	el = $('<input type="checkbox">'),
	b = cxl.binding({ el: el, ref: fb.child('cxl-binding/bool') })
;
	a.equal(b.setViewValue, cxl.Binding.setView.checkbox);
	a.equal(el.prop('checked'), false);

	el.on('sync', function() {
		a.equal(el.prop('checked'), true);
		b.unbind();
		done();
	});
});

QUnit.test('cxl.Binding#getView text', function(a) {
var
	done = a.async(),
	el = $('<input type="text">'),
	b = cxl.binding({ el: el, ref: fb.child('cxl-binding/var') }),
	count = 0
;
	el.on('sync', function() {
		if (count++===0)
		{
			a.equal(b.value, 'world');
			el.val('hello').change();
		} else
		{
			a.equal(el.val(), 'hello');
			a.equal(b.value, 'hello');
			b.unbind();
			done();
		}
	});

	el.val('world').change();
});

QUnit.test('cxl.Binding#getView checkbox', function(a) {
var
	done = a.async(),
	el = $('<input type="checkbox">'),
	b = cxl.binding({ el: el, ref: fb.child('cxl-binding/varbool') }),
	count=0
;
	a.equal(b.getViewValue, cxl.Binding.getView.checkbox);
	a.equal(el.prop('checked'), false);

	el.on('sync', function() {
		if (count++===0)
		{
			a.equal(b.value, 'hello');
			a.equal(el.prop('checked'), false);
			// Run change twice to test value check
			el.attr('value', 'hello').prop('checked', true).change().change();
		} else
		{
			a.equal(b.value, 'hello');
			a.equal(el.prop('checked'), true);
			b.unbind();
			done();
		}
	});

});
*/

QUnit.test('cxl.Binding#unbind', function(a) {
var
	el = $('<input type="text">'),
	b = cxl.binding({ el: el, ref: fb.child('cxl-binding/var') })
;
	b.unbind();
	a.ok(b);
});

QUnit.test('cxl.Binding write', function(a) {
var
	done = a.async(),
	b = cxl.binding({ el: cxl.view(), ref: fb.child('cxl-binding/var') })
;
	b.el.val = function(val) {
		a.equal(val, 'hello');
		b.unbind();
		done();
	};

	b.set('hello');
});

QUnit.test('cxl.Binding write error', function(a) {
var
	done = a.async(),
	b = cxl.binding({ el: cxl.view(), ref: fb.child('cxl-binding/bool') })
;
	b.el.error = function(err) {
		a.equal(err.code, 'PERMISSION_DENIED');
		b.unbind();
		done();
	};

	b.set(false);
	b.set(false);
});

QUnit.test('cxl.Binding#bind - addChild', function(a) {
var
	done = a.async(),
	el = new cxl.View({
		addChild: _.debounce(function(snap)
		{
			a.ok(snap);
			b.unbind();
			done();
		}),
		removeChild: function() {},
		moveChild: function() {}
	}),
	b = cxl.binding({ el: el, ref: fb })
;
	a.ok(b);
	a.equal(el.val(), null);
});

QUnit.test('cxl.Binding server validation error', function(a) {
var
	done = a.async(),
	b = cxl.binding({ el: cxl.view(),
		ref: fb.child('cxl-binding/validate') })
;
	b.el.error = function(err) {
		a.equal(err.code, 'PERMISSION_DENIED');
		a.ok(b.value !== 'string is too long');
		b.unbind();
		done();
	};

	b.set('string is too long');
});

/*
QUnit.test('cxl.Binding client validation error', function(a) {
var
	done = a.async(),
	el = $('<input type="text">'),
	b = cxl.binding({
		el: el,
		ref: fb.child('cxl-binding/validate'),
		validate: { minlength: 0, maxlength: 10 }
	})
;
	el.on('sync', function(ev, err) {
		if (err)
		{
			a.equal(err.validator, 'maxlength');
			a.equal(err.code, 'PERMISSION_DENIED');
			a.ok(b.value !== 'string is too long');
			b.unbind();
			done();
		}
	});

	el.val('string is too long').change();
});

QUnit.test('cxl.Validators.required', function(a) {
var
	done = a.async(),
	el = $('<input type="text">'),
	b = cxl.binding({
		el: el,
		ref: fb.child('cxl-binding/validate'),
		validate: { required: true }
	})
;
	el.on('sync', function(ev, err) {
		if (err)
		{
			a.ok(err);
			a.equal(err.validator, 'required');
			a.equal(err.code, 'PERMISSION_DENIED');
			a.ok(b.value !== 'string is too long');
			b.unbind();
			done();
		}
	});

	el.val('').change();
});

QUnit.test('cxl.Validators.max and min', function(a) {
var
	done = a.async(),
	el = $('<input type="text">'),
	b = cxl.binding({
		el: el,
		ref: fb.child('cxl-binding/validate'),
		validate: { min: 5, max: 10 }
	})
;
	el.on('sync', function(ev, err) {
		a.ok(err);
		a.equal(err.validator, 'max');
		a.equal(err.code, 'PERMISSION_DENIED');
		a.ok(b.value !== '12');
		b.unbind();
		done();
	});

	el.val('12').change();
});

QUnit.test('cxl.Validators.pattern', function(a) {
var
	done = a.async(),
	el = $('<input type="text">'),
	b = cxl.binding({
		el: el,
		ref: fb.child('cxl-binding/validate'),
		validate: { pattern: /\w\d/ }
	})
;
	el.on('sync', function(ev, err) {
		if (!err)
		{
			a.equal(b.value, 'd3');
			el.val('invalid').change();
		} else {
			a.ok(err);
			a.equal(err.validator, 'pattern');
			a.equal(err.code, 'PERMISSION_DENIED');
			a.ok(b.value !== 'invalid');
			b.unbind();
			done();
		}
	});

	el.val('d3').change();

});

QUnit.test('cxl.Validators.json', function(a) {
var
	done = a.async(),
	el = $('<input type="text">'),
	b = cxl.binding({
		el: el,
		ref: fb.child('cxl-binding/validate'),
		validate: { json: true }
	})
;
	el.on('sync', function(ev, err) {
		if (!err)
		{
			a.equal(b.value, '"json"');
			el.val('{ notjson }').change();
		} else
		{
			a.ok(err);
			a.equal(err.validator, 'json');
			a.equal(err.code, 'PERMISSION_DENIED');
			a.ok(b.value !== '{ notjson }');
			b.unbind();
			done();
		}
	});

	el.val('"json"').change();
});
*/

QUnit.module('cxl.TemplateCompiler');

QUnit.test('cxl.TemplateCompiler - view directive', function(a) {
	var tpl;
	var div = $('<div><div &="' + a.test.testId + '"></div></div>');

	cxl.directive(a.test.testId, { template: 'Hello' });
	tpl = cxl.compile(div);

	a.ok(tpl);
	a.equal(div.children().html(), 'Hello');

	tpl.destroy();
});

QUnit.test('cxl.TemplateCompiler - list view directive', function(a) {
	var tpl, fn = function() {};
	var div = $('<div><div &="' + a.test.testId + '"></div></div>');
	var done = a.async();

	cxl.directive(a.test.testId, {
		template: 'Hello',
		addChild: _.debounce(function(snap)
		{
			a.ok(snap);
			tpl.destroy();
			done();
		}),
		removeChild: fn, moveChild: fn
	});
	tpl = cxl.compile(div, fb.child('cxl-binding'));

	a.ok(tpl);
	a.equal(div.children().html(), 'Hello');
});

QUnit.test('cxl.TemplateCompiler - attribute directive', function(a) {
	var tpl;
	var div = $('<div><div &="@' + a.test.testId + '"></div></div>');

	cxl.directive('attribute', {
		template: 'Hello'
	});
	tpl = cxl.compile(div);

	a.ok(tpl);
	a.equal(div.children().html(), 'Hello');
	a.equal(tpl.bindings[0].parameters, a.test.testId);

	tpl.destroy();
});

QUnit.test('cxl.TemplateCompiler - class directive', function(a) {
	var tpl;
	var div = $('<div><div &=".' + a.test.testId + ':cxl-binding"></div></div>');

	cxl.directive('class', {
		template: 'Hello'
	});
	tpl = cxl.compile(div, fb);

	a.ok(tpl);
	a.equal(div.children().html(), 'Hello');
	a.equal(tpl.bindings[0].parameters, a.test.testId);

	tpl.destroy();
});

QUnit.test('cxl.TemplateCompiler#compile - string', function(a) {
	var tpl = cxl.compile('<div>Hello</div>');

	a.equal(tpl.el[0].nodeType, 11);
});


/*
QUnit.test('cxl.TemplateCompiler#compile', function(a) {
var
	done = a.async(),
	el = $('<div><div &="cxl-binding/string"></div></div>'),
	compiled = cxl.compile(el, fb),
	div = el.children()
;
	a.ok(compiled);

	div.on('sync', function() {
		a.equal(div.html(), 'string');
		compiled.unbind();
		done();
	});
});

QUnit.test('cxl.Template - attribute', function(a) {
var
	done = a.async(),
	el = $('<div><div &="@test:cxl-binding/string"></div></div>'),
	div = el.children(),
	link = cxl.compile(el, fb)
;
	div.on('sync', function() {
		a.equal(div.attr('test'), 'string');
		link.unbind();
		done();
	});
});

QUnit.test('cxl.Template - if', function(a) {
var
	done = a.async(),
	el = $('<div><span &="if:cxl-binding/falsy"></span></div>'),
	span = el.find('span'),
	tpl = cxl.compile(el, fb)
;
	span.on('sync', function() {
		a.equal(el.find('span').length, 0);
		tpl.unbind();
		done();
	});

});
*/


})();
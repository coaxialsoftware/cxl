

(function() {

var
	fb = new Firebase('https://cxl-test.firebaseio.com')
;

QUnit.module('cxl-binding');

QUnit.test('cxl.Binding#constructor', function(a) {
var
	done = a.async(),
	el = new cxl.Emitter(),
	ref = fb.child('cxl-binding/text'),
	b = cxl.binding({ refA: el, refB: ref }),
	fn = function() {
		a.equal(el.value, 'cxl');
		b.unbind();
		done();
	}
;
	if (el.value)
		fn();
	else
		el.on('value', fn);
});


QUnit.test('cxl.Binding#unbind', function(a) {
var
	el = $('<input type="text">'),
	b = cxl.binding({ refA: el, refB: fb.child('cxl-binding/var') })
;
	b.unbind();
	a.ok(b);
	a.ok(!b.refA);
	a.ok(!b.refB);
});

QUnit.test('cxl.Binding write', function(a) {
var
	done = a.async(),
	b = cxl.binding({ refA: new cxl.Emitter(), refB: fb.child('cxl-binding/var') })
;
	b.refA.set = function(val) {
		a.equal(val, a.test.testId);
		b.unbind();
		done();
	};

	b.refB.set(a.test.testId);
});

QUnit.test('cxl.Binding write error', function(a) {
var
	done = a.async(),
	b = cxl.binding({ refA: new cxl.Emitter(), refB: fb.child('cxl-binding/bool') })
;
	b.refA.on('error', function(err) {
		a.equal(err.code, 'PERMISSION_DENIED');
		b.unbind();
		done();
	});

	b.refA.set(false);
});

QUnit.test('cxl.Binding#bind - addChild', function(a) {
var
	done = a.async(),
	el = new cxl.Emitter({
		set: _.debounce(function(snap)
		{
			a.ok(snap);
			b.unbind();
			done();
		})
	}),
	b = cxl.binding({ refA: el, refB: fb, eventB: 'child_added' })
;
	a.ok(b);
	a.equal(el.value, null);
});

QUnit.test('cxl.Binding server validation error', function(a) {
var
	done = a.async(),
	b = cxl.binding({ refA: new cxl.Emitter(),
		refB: fb.child('cxl-binding/validate') })
;
	b.refA.on('error', function(err) {
		a.equal(err.code, 'PERMISSION_DENIED');
		a.ok(b.value !== 'string is too long');
		b.unbind();
		done();
	});

	b.refA.set('string is too long');
});


QUnit.module('cxl.TemplateCompiler');

/*QUnit.test('cxl.TemplateCompiler - view directive', function(a) {
	var tpl;
	var div = $('<div><div &="' + a.test.testId + '"></div></div>');

	cxl.directive(a.test.testId, { template: 'Hello' });
	tpl = cxl.compile(div[0]);

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
	tpl = cxl.compile(div[0], fb.child('cxl-binding'));

	a.ok(tpl);
	a.equal(div.children().html(), 'Hello');
});*/

QUnit.test('cxl.TemplateCompiler - attribute directive', function(a) {
	var tpl;
	var div = $('<div><div &="@' + a.test.testId + '"></div></div>');

	cxl.directive('attribute', function(el, param, scope) {
		a.equal(el, div.children()[0]);
		a.equal(param, a.test.testId);
		a.ok(!scope);
	});
	tpl = cxl.compile(div[0]);
	a.ok(tpl);
	tpl.destroy();
});

QUnit.test('cxl.TemplateCompiler - class directive', function(a) {
	var tpl;
	var div = $('<div><div &=".' + a.test.testId + ':const(bool)"></div></div>');

	tpl = cxl.compile(div[0], { bool: true });

	a.ok(tpl);
	a.ok(div.children().hasClass(a.test.testId));

	tpl.destroy();
});

QUnit.test('cxl.TemplateCompiler - local directive', function(a) {
	var tpl;
	var div = $('<div><div &="#local"></div></div>');
	var scope = {
		local: function(el, param, scope) {
			a.equal(el, div.children()[0]);
			a.equal(param, 'local');
			a.equal(scope, this);
		}
	};
	tpl = cxl.compile(div[0], scope);
	a.ok(tpl);
	tpl.destroy();
});

QUnit.test('cxl.TemplateCompiler#compile - string', function(a) {
	var tpl = cxl.compile('<div>Hello</div>');

	a.equal(tpl.el.nodeType, 11);
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
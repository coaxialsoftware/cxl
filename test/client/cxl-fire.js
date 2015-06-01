
(function() {

var
	fb = new Firebase('https://cxl-test.firebaseio.com')
;

QUnit.module('cxl-fire');

QUnit.test('cxl.directive - ref', function(a) {
var
	done = a.async(),
	el = $('<div><div &="html:&cxl-binding/string"></div></div>'),
	compiled = cxl.compile(el[0], { ref: fb }),
	div = el.children()
;
	a.ok(compiled);

	fb.child('cxl-binding/string').once('value', function() {
		a.equal(div.html(), 'string');
		compiled.destroy();
		done();
	});
});

QUnit.test('cxl.directive - ref on child with param', function(a) {
var
	done = a.async(),
	el = $('<div><div &="compile(b)">' +
		'<div &="html:&cxl-binding/string"></div></div>' +
		'</div>'),
	scope = { ref: fb, b: function() { return { parent: scope }; } },
	compiled = cxl.compile(el[0], scope),
	div = el.children().children()
;
	a.ok(compiled);

	fb.child('cxl-binding/string').once('value', function() {
		a.equal(div.html(), 'string');
		compiled.destroy();
		done();
	});
});

QUnit.test('cxl.directive - ref on child', function(a) {
var
	done = a.async(),
	el = $('<div><div &="compile(b)">' +
		'<div &="html:ref"></div></div>' +
		'</div>'),
	scope = {
		ref: fb.child('cxl-binding/text'),
		b: function() { return { parent: scope }; }
	},
	compiled = cxl.compile(el[0], scope),
	div = el.children().children()
;
	a.ok(compiled);

	scope.ref.once('value', function() {
		a.equal(div.html(), 'cxl');
		compiled.destroy();
		done();
	});
});

})();
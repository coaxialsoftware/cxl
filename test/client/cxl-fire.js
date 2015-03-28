
(function() {

var
	fb = new Firebase('https://cxl-test.firebaseio.com')
;

QUnit.module('cxl-binding');

QUnit.test('cxl.Binding#constructor', function(a) {
var
	done = a.async(),
	el = $('<INPUT type="text" name="test">'),
	b = cxl.bind({ el: el, ref: fb.child('cxl-binding/string') })
;
	a.ok(b);
	a.equal(el.val(), '');

	el.on('sync', function() {
		a.equal(el.val(), 'string');
		done();
	});
});

QUnit.test('cxl.Binding#setView checkbox', function(a) {
var
	done = a.async(),
	el = $('<input type="checkbox">'),
	b = cxl.bind({ el: el, ref: fb.child('cxl-binding/bool') })
;
	a.equal(b.setViewValue, cxl.Binding.setView.checkbox);
	a.equal(el.prop('checked'), false);

	el.on('sync', function() {
		a.equal(el.prop('checked'), true);
		done();
	});
});

})();
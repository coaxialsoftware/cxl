
(function() {

console.log(document.createElement.bind);
var
	fb = new Firebase('https://cxl-test.firebaseio.com'),
	dom = document.createElement.bind(document)
;

QUnit.module('cxl-binding');

QUnit.test('cxl.Binding#constructor', function(a) {
var
	el = dom('INPUT'),
	b = new cxl.Binding({
		el: el,
		ref: fb.child('cxl-binding.string')
	})
;
	a.ok(b);
	a.equal(el.value, 'string');
});

})();
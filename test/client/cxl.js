
(function() {

/*
var
	m1 = cxl('m1'),
	m2 = cxl('m1.m2')
;
*/

QUnit.module('cxl');

QUnit.test('cxl.error', function(a) {

	a.throws(function() { cxl.error('Test'); });

});


})();
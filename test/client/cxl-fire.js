
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
		b.unbind();
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
		b.unbind();
		done();
	});
});

QUnit.test('cxl.Binding#getView text', function(a) {
var
	done = a.async(),
	el = $('<input type="text">'),
	b = cxl.bind({ el: el, ref: fb.child('cxl-binding/var') }),
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
	b = cxl.bind({ el: el, ref: fb.child('cxl-binding/varbool') }),
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

QUnit.test('cxl.Binding#unbind', function(a) {
var
	el = $('<input type="text">'),
	b = cxl.bind({ el: el, ref: fb.child('cxl-binding/var') })
;
	b.unbind();
	a.ok(b);
});

QUnit.test('cxl.Binding write error', function(a) {
var
	done = a.async(),
	el = $('<input type="checkbox">'),
	b = cxl.bind({ el: el, ref: fb.child('cxl-binding/bool') })
;
	el.on('sync', function(ev, err) {
		if (err)
		{
			a.equal(err.code, 'PERMISSION_DENIED');
			a.equal(el.prop('checked'), true);
			b.unbind();
			done();
		}
	});

	el.prop('checked', false).change();
});

QUnit.test('cxl.Binding server validation error', function(a) {
var
	done = a.async(),
	el = $('<input type="text">'),
	b = cxl.bind({ el: el, ref: fb.child('cxl-binding/validate') })
;
	el.on('sync', function(ev, err) {
		if (err)
		{
			a.equal(err.code, 'PERMISSION_DENIED');
			a.ok(b.value !== 'string is too long');
			b.unbind();
			done();
		}
	});

	el.val('string is too long').change();
});

QUnit.test('cxl.Binding server validation error', function(a) {
var
	done = a.async(),
	el = $('<input type="text">'),
	b = cxl.bind({ el: el, ref: fb.child('cxl-binding/validate') })
;
	el.on('sync', function(ev, err) {
		if (err)
		{
			a.equal(err.code, 'PERMISSION_DENIED');
			a.ok(b.value !== 'string is too long');
			b.unbind();
			done();
		}
	});

	el.val('string is too long').change();
});

QUnit.test('cxl.Binding client validation error', function(a) {
var
	done = a.async(),
	el = $('<input type="text">'),
	b = cxl.bind({
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
	b = cxl.bind({
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
	b = cxl.bind({
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
	b = cxl.bind({
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
	b = cxl.bind({
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


})();
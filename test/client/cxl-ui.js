

(function() {

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

/*
QUnit.module('cxl-ui');

var	fb = new Firebase('https://cxl-test.firebaseio.com/cxl-ui');

QUnit.test('cxl.Field text value', function(a) {
var
	done = a.async(),
	el = $('<input>'),
	field = new cxl.Field({ el: el }),
	bind = cxl.binding({ el: el, ref: fb.child('text') })
;
	field.on('sync', function() {
		a.equal(bind.value, 'Free Text Value');
		a.ok(!field.empty);
		done();
	});

});

QUnit.test('cxl.Field with template', function(a) {
var
	group = $('<div class="form-group"><label>Hello <input ' +
		'type="text"></label><span class="error-block">' +
		'Error</span><div>'),
	field = new cxl.Field({
		el: group.find('input')
	})
;
	a.ok(field.$group.length);
	a.ok(field.$label.length);
	a.equal(field.$error.html(), 'Error');
});

QUnit.test('cxl.Field empty', function(a) {
var
	done = a.async(),
	el = $('<input>'),
	field = new cxl.Field({ el: el }),
	bind = cxl.binding({ el: el, ref: fb.child('empty') })
;
	field.on('sync', function() {
		a.equal(bind.value, '');
		a.ok(field.empty);
		done();
	});

});

QUnit.test('cxl.Field manual validation', function(a) {
var
	done = a.async(),
	field = new cxl.Field(),
	bind = cxl.binding({
		el: field.$el,
		ref: fb.child('empty'),
		validate: function() { return "ERROR"; }
	})
;
	field.on('sync', function(err) {
		if (err)
		{
			a.ok(!bind.value);
			a.equal(err, "ERROR");
			done();
		}
	});
	field.$el.val('hello').trigger('change');
});

QUnit.test('cxl.Field no bind', function(a) {
var
	field = new cxl.Field()
;
	a.ok(field);
});

QUnit.test('cxl.Field validation required', function(a) {
var
	done = a.async(),
	field = new cxl.Field()
;
	cxl.binding({
		el: field.$el,
		ref: fb.child('text'),
		validate: { required: true }
	});

	field.on('sync', function(err) {
		if (err)
		{
			a.ok(err);
			a.equal(err.validator, 'required');
			field.$el.val('Free Text Value').trigger('change');
		} else
		{
			a.ok(!field.$group.hasClass('has-error'));
			done();
		}

	});
	field.$el.val('').trigger('change');

});

QUnit.test('list', function(a) {
var
	done = a.async(),
	list = cxl.view('list').create({
		itemTemplate: '<span @=""></span>'
	}),
	bind = cxl.binding({ el: list.$el, ref: fb })
;
	a.ok(list);
	a.ok(bind);
	list.$el.on('sync', function(ev, err, val) {
		a.ok(!err);
		a.ok(val);
		done();
		bind.unbind();
	});
});
*/

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

})();
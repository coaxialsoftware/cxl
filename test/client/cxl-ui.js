

(function() {

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

QUnit.test('cxl.List', function(a) {
var
	done = a.async(),
	list = new cxl.List({
		template: '<span @=""></span>'
	}),
	bind = cxl.binding({ el: list.$el, ref: fb })
;
	a.ok(list);
	a.ok(bind);
	list.$el.on('sync', function(ev, err, val) {
		a.ok(!err);
		a.ok(val);
		done();
	});
});

})();
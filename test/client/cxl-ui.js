

(function() {

QUnit.module('cxl-ui');

var	fb = new Firebase('https://cxl-test.firebaseio.com/cxl-ui');

QUnit.test('cxl.Field text value', function(a) {
var
	done = a.async(),
	field = new cxl.Field({
		bind: fb.child('text')
	})
;
	field.on('change', function(val) {
		a.equal(val, 'Free Text Value');
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
		el: group.find('input'),
		bind: fb.child('text')
	})
;
	a.ok(field.$group.length);
	a.ok(field.$label.length);
	a.equal(field.$error.html(), 'Error');
});

QUnit.test('cxl.Field empty', function(a) {
var
	done = a.async(),
	field = new cxl.Field({
		bind: fb.child('empty')
	})
;
	field.on('change', function(val) {
		a.equal(val, '');
		a.ok(field.empty);
		done();
	});

});

QUnit.test('cxl.Field manual validation', function(a) {
var
	done = a.async(),
	field = new cxl.Field({
		bind: {
			ref: fb.child('empty'),
			validate: function() { return "ERROR"; }
		}
	})
;
	field.on('sync', function(err) {
		if (err)
		{
			a.equal(err, "ERROR");
			a.ok(field.empty);
			done();
		}
	});
	field.val('hello');
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
	field = new cxl.Field({
		bind: {
			ref: fb.child('text'),
			validate: { required: true }
		}
	})
;
	field.on('sync', function(err) {
		if (err)
		{
			a.ok(err);
			a.equal(err.validator, 'required');
			field.val('Free Text Value');
		} else
		{
			a.ok(!field.$group.hasClass('has-error'));
			done();
		}

	});
	field.val('');

});

})();
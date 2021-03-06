
(function() {

/*var
	fb = new Firebase('https://cxl-test.firebaseio.com')
;*/

QUnit.module('cxl');

QUnit.test('cxl.Router', function(a) {
	a.ok(!cxl.router.started);
	cxl.router.refresh();
	a.ok(cxl.router.started);
	cxl.router.refresh();
	a.ok(cxl.router.started);
});

QUnit.test('cxl.error', function(a) {
	a.throws(function() { cxl.error('Test'); });
});

QUnit.test('cxl.log', function(a) {
	cxl.log("hello");
	a.ok(cxl.log);
});

QUnit.test('cxl.resolve - value', function(a) {
var
	done = a.async()
;
	cxl.resolve({ hello: 'world' }).then(function(val) {
		a.equal(val.hello, 'world');
		done();
	});
});

QUnit.test('cxl.resolve - array', function(a) {
var
	done = a.async()
;
	cxl.resolve([ 'hello', 'world' ]).then(function(b, c) {
		a.equal(b, 'hello');
		a.equal(c, 'world');
		done();
	});
});

QUnit.test('cxl.go', function(a) {
	cxl.history.stop();
	cxl.go(a.test.testId);
	a.ok(window.location.hash, a.test.testId);
});

QUnit.test('cxl.start', function(a) {
	cxl.history.stop();
	cxl.start();
	a.ok(cxl.router.started);
});

/*
QUnit.test('cxl.template', function(a) {

	$('body').append('<script type="text/template" id="' + a.test.testId + '">' +
		'<div class="{{hello}}"><% _.each([1, 2, 3], function(i) { %><span>{{i}}' +
		'</span><% }) %></div></script>'
	);

	var tpl = $(cxl.template(a.test.testId)({ hello: 'world' }));

	a.ok(tpl);
	a.ok(tpl.hasClass('world'));
	a.equal(tpl.children().length, 3);

});

QUnit.module('cxl.Module');

QUnit.test('cxl.Module#run', function(a) {
var
	done
;
	cxl.module(a.test.testId).run(function() { done = true; })
		.start();
	a.ok(done);
});

QUnit.test('cxl.Module#config', function(a) {
var
	done
;
	cxl.module(a.test.testId).config(function() { done=1; })
		.run(function() { done = 2; })
		.start()
	;

	a.equal(done, 2);
});

QUnit.test('cxl.Module#view', function(a) {
var
	def = function() { return {}; },
	m = cxl.module(a.test.testId).view('view', def).start(),
	TestView = cxl.view('test'),
	View = m.view('view'),
	v = new View(),
	test = new TestView()
;
	a.equal(test.name, 'test');
	a.equal(cxl.views.test, TestView);
	a.equal(v.name, 'view');
	a.equal(cxl.views[a.test.testId + '.view'], View);
});

QUnit.test('cxl.Module#route', function(a) {
var
	m = cxl.module(a.test.testId).route('hello', function() { })
;
	m.start();
	a.ok(m);
});

QUnit.test('cxl.Module#route - function', function(a) {
var
	m = cxl.module(a.test.testId).route('hello', function() {
		return function() { };
	})
;
	m.start();
	a.ok(m);
});

QUnit.test('cxl.Module#start', function(a) {
var
	m = cxl.module(a.test.testId).start().start()
;
	a.ok(m.started);
});
*/

QUnit.module('cxl.View');

/*
QUnit.test('cxl.View#ref', function(a) {
var
	done = a.async(),
	tpl = $('<script type="text/template" id="template2"><span &="cxl-binding/string"></span></script>').appendTo('body'),
	view = new cxl.View({
		templateUrl: 'template2',
		ref: fb
	}),
	span = view.$el.find('span')
;
	a.ok(span.length);
	a.ok(view.template);
	span.on('sync', function() {
		a.ok(tpl);
		a.ok(view.template);
		a.equal(span.html(), 'string');
		view.destroy();
		done();
	});
});
*/

QUnit.test('cxl.View#destroy', function(a) {
var
	v = new cxl.View()
;
	v.unbind();
	a.ok(v);
});

QUnit.test('cxl.View#initialize', function(a) {
var
	done = a.async()
;
	new cxl.View({
		el: 'body',
		initialize: function(el)
		{
			a.ok(el);
			done();
		}
	});
});

/*QUnit.test('cxl.View#set', function(a) {
var
	view = new cxl.View()
;
	a.ok(!view.value);
	view.set('hello');
	view.set('hello');
	a.equal(view.value, 'hello');
});*/

QUnit.module('cxl.Route');

QUnit.test('cxl.Route', function(a) {
var
	route = new cxl.Route()
;
	a.ok(route);
});

QUnit.test('cxl.Route#resolve - function', function(a) {
var
	done = a.async()
;
	new cxl.Route({
		resolve: function() { return { hello: 'world' }; },
		initialize: function() {
			a.equal(this.resolve.hello, 'world');
			done();
		}
	});
});


})();
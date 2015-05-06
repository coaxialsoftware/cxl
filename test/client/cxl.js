
(function() {

var
	fb = new Firebase('https://cxl-test.firebaseio.com')
;

QUnit.module('cxl');

cxl.view('test', function() {
	return {};
});

QUnit.test('cxl.error', function(a) {
	a.throws(function() { cxl.error('Test'); });
});

QUnit.test('cxl.log', function(a) {
	cxl.log("hello");
	a.ok(cxl.log);
});

QUnit.test('cxl.id', function(a) {
	var div = $('<div id="test">').appendTo('body');

	a.ok(cxl.id('test'));
	div.remove();
});

QUnit.test('cxl.module', function(a) {
var
	m = cxl.module(a.test.testId)
;
	a.ok(m);
	a.ok(!m.started);
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

QUnit.test('cxl.Module#start', function(a) {
var
	m = cxl.module(a.test.testId).start().start()
;
	a.ok(m.started);
});

QUnit.module('cxl.View');

QUnit.test('cxl.View#templateUrl', function(a) {
var
	tpl = $('<script type="text/template" id="template">Hello World</script>').appendTo('body'),
	view = new cxl.View({
		templateUrl: 'template'
	})
;
	a.ok(tpl);
	a.ok(view.template);
});

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
	a.ok(view.template.bindings.length);
	span.on('sync', function() {
		a.ok(tpl);
		a.ok(view.template);
		a.equal(span.html(), 'string');
		view.template.unbind();
		done();
	});
});

QUnit.test('cxl.View.create', function(a) {
var
	view = cxl.View.create({ template: 'Hello' })
;
	a.equal(view.$el.html(), 'Hello');
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

QUnit.module('cxl.Route');

QUnit.test('cxl.Route', function(a) {
var
	route = new cxl.Route()
;
	a.ok(route);
});

QUnit.test('cxl.Route#resolve - function', function(a) {
var
	route = new cxl.Route({
		resolve: function() { return { hello: 'world' }}
	})
;
	console.log(route.resolve);
	a.equal(route.resolve.hello, 'world');
});


})();
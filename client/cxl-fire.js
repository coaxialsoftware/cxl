
(function(cxl) {


function findRef(scope)
{
	var result;

	while (!result && (scope = scope.parent))
		result = scope.ref;

	return result;
}

cxl.templateCompiler.registerShortcut('&', 'refval');
cxl.directive('refval', function(el, param, scope) {
	// Find _ref in scope.
	// If not in scope find in parents and set to current scope
	var ref = scope.ref || findRef(scope);
	return param ? ref.child(param) : ref;
});

cxl.directive('ref', function(el, param, scope) {
	return new cxl.Emitter({
		initialize: function() {
			var ref = scope.ref || findRef(scope);
			this.set(param ? ref.child(param) : ref);
		}
	});
});

cxl.directive('refkey', {
	on: function()
	{
		cxl.View.prototype.on.apply(this, arguments);
		var ref = this.parent.ref || findRef(this.parent);
		this.set(ref && ref.key());
	}
});

})(this.cxl);




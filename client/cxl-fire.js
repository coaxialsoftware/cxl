
(function(cxl, _, Firebase) {


function findRef(scope)
{
	var result;

	while (!result && (scope = scope.parent))
		result = scope.ref;

	return result;
}

cxl.Model = Firebase;

cxl.templateCompiler.registerShortcut('&', 'refval');
cxl.directive('refval', function(el, param, scope) {
	// Find _ref in scope.
	// If not in scope find in parents and set to current scope
	var ref = scope.ref || findRef(scope);
	return param ? ref.child(param) : ref;
});

cxl.directive('ref', {
	on: function()
	{
		cxl.View.prototype.on.apply(this, arguments);
		var ref = this.parent.ref || findRef(this.parent);
		this.set(this.parameters ? ref.child(this.parameters) : ref);
	}
});

cxl.directive('refkey', {
	on: function()
	{
		cxl.View.prototype.on.apply(this, arguments);
		var ref = this.parent.ref || findRef(this.parent);
		this.set(ref && ref.key());
	}
});

})(this.cxl, this._, this.Firebase);





(function(cxl, _, Firebase) {


/*
_.extend(cxl.Binding, {

	setView: {
		attribute: function(val)
			{ this.el.attr(this.attribute, val); },
		'if': function(val)
		{
			if (!this.marker)
			{
				this.marker = $(document.createComment('bind'));
				this.el.before(this.marker);
			}

			if (val)
				this.marker.insertAfter(this.el);
			else
				this.el.detach();
		},

		content: function(val) {
			this.el.html(val);
		},
		value: function(val) { return this.el.val(val); },
		checkbox: function(val)
		{
			var value = this.el.attr('value') || true;
			return this.el.prop('checked', value===val);
		}
	},

	getView: {
		attribute: function() { return this.el.attr(this.attribute); },
		'if': function() { return this.value; },
		value: function() { return this.el.val(); },
		content: function() {
			return this.value;
		},
		checkbox: function()
		{
			var val = this.el.attr('value') || true;
			return this.el.prop('checked') ? val : false;
		}
	}

});
*/

function findRef(scope)
{
	var result;

	while (!result && (scope = scope.parent))
		result = scope.ref;

	return result;
}

cxl.Model = Firebase;

cxl.directive('ref', function(el, param, scope) {
	// Find _ref in scope.
	// If not in scope find in parents and set to current scope
	var ref = scope.ref || findRef(scope);

	return param ? ref.child(param) : ref;
});

})(this.cxl, this._, this.Firebase);




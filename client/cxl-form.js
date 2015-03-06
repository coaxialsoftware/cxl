

(function(cxl, Backbone, _) {
"use strict";

_.extend(Backbone.Model.prototype, Backbone.Validation.mixin);

cxl.Form = Backbone.View.extend({

	model: null,
	bindings: null,

	initialize: function(options)
	{
		this.model = options.model;
		this.bindings = [];
		this.render();
	},

	bindElement: function(el)
	{
	var
		name = el.getAttribute('name')
	;
		if (!name)
			return;

		this.bindings.push(new cxl.Binding({
			el: el,
			model: this.model,
			attribute: name
		}));

	},

	onValidated: function(isValid, model, errors)
	{
		window.console.log(isValid, model, errors);
	},

	render: function()
	{
		var els = this.el.elements;
		_.each(els, this.bindElement, this);

		this.model.on('validated', this.onValidated, this);
	}

});


})(this.cxl, this.Backbone, this._);

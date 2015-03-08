

(function(cxl, Backbone, _, $) {
"use strict";

Backbone.Validation.configure({
	forceUpdate: true
});

_.extend(Backbone.Model.prototype, Backbone.Validation.mixin);

cxl.Field = Backbone.View.extend({

	$label: null,
	$group: null,
	$error: null,

	valid: true,
	empty: null,

	update: function()
	{
	var
		val = this.binding && this.binding.value || this.$el.val(),
		empty = _.isEmpty(val)
	;
		if (this.empty !== empty)
		{
			this.empty = empty;
			this.$group.toggleClass('cxl-empty', empty);
		}
	},

	setValid: function()
	{
		if (this.valid)
			return;

		this.$group.removeClass('has-error');
		this.valid = true;
	},

	setInvalid: function(errors)
	{
		if (!this.valid)
			return;

		var error = typeof(errors)==='string' ? errors : errors[0];

		this.$group.addClass('has-error');
		this.$error.html(error);

		this.valid = false;
	},

	constructor: function(options)
	{
		Backbone.View.apply(this, arguments);

		this.$group = this.$el.parents('.form-group:eq(0)');
		this.$label = this.$group.find('label');
		this.$error = this.$group.find('.error-block');

		if (!this.$error.length)
			this.$error = $('<span class="help-block error-block">')
				.appendTo(this.$group);

		this.name = options.name;

		if (this.name)
		{
			this.model = options.model;
			this.binding = new cxl.Binding({
				el: this.$el,
				model: this.model,
				attribute: this.name
			});
		}

		this.update();
	}

});

cxl.Form = Backbone.View.extend({

	model: null,
	fields: null,
	syncTimeout: 1000,

	events: {
		'submit': 'onSubmit'
	},

	initialize: function(options)
	{
		this.model = options.model;
		this.fields = {};
		this.render();
	},

	bindElement: function(el)
	{
	var
		$el = $(el),
		name = $el.attr('name')
	;
		this.fields[name] = new cxl.Field({
			el: $el,
			model: this.model,
			name: name
		});
	},

	onValidated: function(isValid, model, errors)
	{
		this.$el.toggleClass('cxl-invalid', !isValid);

		_.each(this.fields, function(field) {
			field.update();

			if (field.binding)
			{
				var err = errors[field.binding._attr];
				field[err ? 'setInvalid' : 'setValid'](err);
			}
		}, this);
	},

	render: function()
	{
		var els = this.el.elements;
		_.each(els, this.bindElement, this);

		this.model.on('validated', this.onValidated, this);
		this.model.on('change',
			_.debounce(this.sync, this.syncTimeout), this);
	},

	sync: function()
	{
		if (this.model.isValid())
			this.model.save(this.model.changed, { patch: true });
	},

	onSubmit: function(ev)
	{
		this.sync();
		ev.preventDefault();
	}

});


})(this.cxl, this.Backbone, this._, this.jQuery);



(function(cxl, _, $) {
"use strict";

cxl.Field = cxl.View.extend({

	$label: null,
	$group: null,
	$error: null,

	valid: true,
	empty: null,

	onChange: function(err)
	{
		var empty = _.isEmpty(this.$el.val());

		if (this.empty !== empty)
		{
			this.empty = empty;
			this.$group.toggleClass('cxl-empty', empty);
		}

		this.setValidity(!err, err);
	},

	setValidity: function(valid, error)
	{
		if (this.valid === valid)
			return;

		this.valid = valid;
		this.$group[valid ? 'removeClass':'addClass']('has-error');
		this.$error.html(error || '');
	},

	render: function()
	{
		this.$group = this.$el.parents('.form-group');
		this.$label = this.$group.find('label');
		this.$error = this.$group.find('.error-block');

		if (!this.$error.length)
			this.$error = $('<span class="help-block error-block">')
				.appendTo(this.$group);

		this.on('sync', this.onChange, this);
	}

});

cxl.List = cxl.View.extend({

	initialize: function()
	{
		var html = this.$el.html();

		if (html)
		{
			this.$el.empty();
			this.template = cxl.template(html);
		}
	},

	render: function()
	{
		this.on('add', this.onAdd, this);
		this.on('remove', this.onRemove, this);
		this.on('move', this.onMove, this);
		this.on('sync', this.onSync, this);
	},

	loadTemplate: function()
	{
	},

	onSync: function()
	{
		window.console.log(this.bind.value);
	},

	onAdd: function(snap)
	{
		var item = this.template(snap.ref());
		this.$el.append(item);
	},

	onRemove: function()
	{

	},

	onMove: function()
	{

	}

});

/*
cxl.Form = cxl.View.extend({

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
				var err = errors[field.binding.attribute];
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
*/


})(this.cxl, this._, this.jQuery, this.Firebase);

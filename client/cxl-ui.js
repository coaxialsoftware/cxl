

(function(cxl, _, $) {
"use strict";

cxl.Field = cxl.View.extend({

	$label: null,
	$group: null,
	$error: null,

	valid: true,
	empty: null,

	sync: function(err)
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
	}

});

cxl.List = cxl.View.extend({

	// Item Template
	template: null,

	load: function()
	{
		var html = this.$el.html();

		if (html)
		{
			this.$el.empty();
			this.template = html;
		}

		cxl.View.prototype.load.apply(this, arguments);

		this.$el.on('add', this.onAdd, this);
		this.$el.on('remove', this.onRemove, this);
		this.$el.on('move', this.onMove, this);
	},

	loadBinding: function()
	{
	},

	loadTemplate: function()
	{
	},

	sync: function(err, val)
	{
		window.console.log(err, val);
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

cxl.Form = cxl.View.extend({

	events: {
		'submit': 'onSubmit'
	},

	fields: null,

	bindElement: function(bind)
	{
		this.fields.push(new cxl.Field({
			el: bind.el
		}));
	},

	render: function()
	{
		this.fields = [];
		_.each(this.bind, this.bindElement, this);
	},

	onSubmit: function(ev)
	{
		ev.preventDefault();
	}

});


})(this.cxl, this._, this.jQuery, this.Firebase);

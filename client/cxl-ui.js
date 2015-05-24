

(function(cxl, _, $) {
"use strict";

cxl.validator = function(op)
{
	return function(val)
	{
		var rule, fn;

		for (rule in op)
		{
			fn = cxl.Validators[rule];

			if (fn && fn(val, op[rule])!==true)
			{
				return {
					code: 'PERMISSION_DENIED',
					validator: rule
				};
			}
		}
	};
};

cxl.Validators = {

	json: function(value)
	{
		try {
			if (value!=="")
				JSON.parse(value);
		} catch(e) {
			return false;
		}
		return true;
	},

	required: function(value)
	{
		return (value!==undefined && value!==null && value!=="");
	},

	max: function(value, max)
	{
		return +value <= max;
	},

	min: function(value, min)
	{
		return +value >= min;
	},

	maxlength: function(value, max)
	{
		return value && _.has(value, 'length') && value.length<=max;
	},

	minlength: function(value, min)
	{
		return value && _.has(value, 'length') && value.length>=min;
	},

	pattern: function(value, regex)
	{
		return regex.test(value);
	}

};

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

cxl.view('switch', function() {

return {

	bindingType: 'checkbox',

	sync: function(err, val)
	{
		this.$el.parent().toggleClass('active', val===true);
	}

};

});

cxl.directive('attribute', {

	val: function(val)
	{
		this.$el.attr(this.parameters, val);
	}

});

cxl.view('list', function() {

return {

	// Item Template
	itemTemplate: null,

	load: function()
	{
		var html = this.el.innerHTML;

		if (!this.itemTemplate && html)
		{
			this.$el.empty();
			this.itemTemplate = html;
		}

		cxl.View.prototype.load.apply(this, arguments);

		this.$el.on('add', this.onAdd.bind(this));
		this.$el.on('remove', this.onRemove.bind(this));
		this.$el.on('move', this.onMove.bind(this));
	},

	onAdd: function(ev, snap)
	{
		var item = cxl.compile(this.itemTemplate, snap.ref());
		this.$el.append(item.el);
	},

	onRemove: function()
	{
		window.console.log('remove', arguments);
	},

	onMove: function()
	{
		window.console.log('move', arguments);
	}

};

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
		_.each(this.ref, this.bindElement, this);
	},

	onSubmit: function(ev)
	{
		ev.preventDefault();
	}

});


})(this.cxl, this._, this.jQuery, this.Firebase);

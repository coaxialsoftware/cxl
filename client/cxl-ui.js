

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

cxl.ui = { };
	
cxl.ui.ListItem = cxl.View;

cxl.ui.List = cxl.View.extend({

	// Item Template
	itemTemplate: null,

	// Item View Class
	itemView: cxl.ui.ListItem,

	items: null,

	initialize: function()
	{
	var
		html = this.el.innerHTML
	;
		if (!this.itemTemplate && html)
		{
			this.$el.empty();
			this.itemTemplate = html;
		}

		this.items = {};
	},
	
	on: cxl.Emitter.prototype.on,
	off: cxl.Emitter.prototype.off,
	once: cxl.Emitter.prototype.once,

	set: function(ref)
	{
		this.listenTo(ref, 'child_added', this.onAdd);
		this.listenTo(ref, 'child_removed', this.onRemove);
		this.listenTo(ref, 'child_moved', this.onMove);
	},

	unbind: function()
	{
		_.invoke(this.items, 'unbind');
		this.off();
		cxl.View.prototype.unbind.call(this);
	},

	onAdd: function(snap)
	{
		var item = new this.itemView({
			parent: this,
			template: this.itemTemplate,
			ref: snap.ref()
		});

		this.items[snap.key()] = item;
		item.setElement($(item.el).children());
		this.$el.append(item.el);
	},

	onRemove: function(snap)
	{
	var
		key = snap.key(),
		item = this.items[key]
	;
		if (item)
		{
			delete this.items[key];
			item.$el.remove();
		}
	},

	onMove: function()
	{
		window.console.log('move', arguments);
	}

});
	
cxl.directive('ui.input', function(el) {
	
	return new cxl.Emitter({
		initialize: function() {
			this.listenTo(el, 'change', function() {
				this.set(el.value);
			});
		},
		update: function(val) {
			el.value = val;
		}
	});

});

cxl.directive('ui.switch', function(el) {
	
	return new cxl.Emitter({
		initialize: function() {
			this.listenTo(el, 'click', function(ev) {
				this.set(el.checked);
				ev.stopPropagation();
			});
		},
		
		update: function(val) {
			el.checked = val;
		}
	});
	
});

cxl.directive('ui.list', cxl.ui.List);

})(this.cxl, this._, this.jQuery, this.Firebase);


(function(cxl, _, $) {

/**
 * Two way Binding for firebase objects.
 *
 * options:
 *
 * el   DOM element or jQuery selector
 * ref  Firebase reference
 *
 */
cxl.Binding = function(options)
{
	// TODO restrict options
	_.extend(this, options);

	this.el = $(this.el);
	this.setViewHandlers();
	this.bind();
};

_.extend(cxl.Binding, {

	setView: {
		value: function(val) { this.el.val(val); },
		checkbox: function(val) { this.el.prop('checked', !!val); }
	},

	getView: {
		value: function() { return this.el.val(); },
		checkbox: function() { return this.el.prop('checked'); }
	}

});

_.extend(cxl.Binding.prototype, {

	/**
	 * DOM element or jQuery selector.
	 */
	el: null,

	/**
	 * Firebase reference
	 */
	ref: null,

	setViewHandlers: function()
	{
	var
		type = this.el.attr('type')
	;
		if (!this.setViewValue)
		{
			this.setViewValue = cxl.Binding.setView[
				type==='checkbox' ? 'checkbox': 'value'
			];
		}

		if (!this.getViewValue)
		{
			this.getViewValue = cxl.Binding.getView[
				type==='checkbox' ? 'checkbox': 'value'
			];
		}
	},

	unbind: function()
	{
		this.ref.off('value', this.onModelChange, this);
		this.el.off('change', this._ovc);
	},

	bind: function()
	{
		this.ref.on('value', this.onModelChange, this);
		this._ovc = this.onViewChange.bind(this);
		this.el.on('change input', this._ovc);
	},

	onModelChange: function(snapshot)
	{
		this.setViewValue(snapshot.val());
	},

	onViewChange: function()
	{
		var val = this.getViewValue();

		if (this.viewValue!==val)
		{
			this.ref.set(val);
			this.viewValue = val;
		}
	}

});

})(this.cxl, this._, this.jQuery);

cxl('cxl').view('form', function() {
"use strict";

return {

	model: null,

	initialize: function()
	{
		console.log(this.el);
		this.stickit();
	}

};

}).run(function() {

	cxl.Form = cxl('cxl').view('form');

});
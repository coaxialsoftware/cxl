cxl Framework
=============

A collection of libraries and tools used to develop Coaxial Software
Applications.

Dependencies
------------

Client

- jQuery 
- Underscore or Lodash
- Backbone.Validation
- Backbone 
- Firebase for instant data.
- Gravatar
- Bootstrap

Server

- Bookshelf
- Knex
- Bluebird promises
- Express Session
- Express

Tools

- Grunt
- Karma
- CloudFlare CDN


Project Structure
-----------------

client
client/boot.js

server

less


Assumptions
-----------

A special build of jQuery will be used. It will remove custom selectors
and other obsolete features like JSONP.

AJAX will always send credentials.

	$.ajaxSetup({ xhrFields: { withCredentials: true } });
	
If an AJAX call returns a 403 (Forbidden) the app will be redirected to
the login route defined in cxl.loginRoute. By default it is "/login".


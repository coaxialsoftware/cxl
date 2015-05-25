module.exports = function(grunt) {

	grunt.initConfig({

		client: grunt.file.readJSON('bower.json'),
		server: grunt.file.readJSON('package.json'),

		src: {
			client: [ 'client/cxl.js', 'client/cxl-fire.js', 'client/cxl-ui.js' ]
		},

		clean: {
			client: [ 'dist' ]
		},

		jshint: {
			client: {
				options: { jshintrc: 'client/.jshintrc' },
				src: 'client/**/*.js'
			},

			server: {
				options: { jshintrc: 'server/.jshintrc' },
				src: 'server/**/*.js'
			},

			test: {
				options: { jshintrc: 'test/.jshintrc' },
				src: 'test/**/*.js'
			}
		},

		concat: {
			options: {
				banner: grunt.file.read('client/banner.txt'),
				stripBanners: true,
			},

			client: {
				files: {
					'dist/<%=client.name%>.js': '<%=src.client%>',
					'dist/<%=client.name%>.dbg.js': [
						'<%= src.client %>', 'client/cxl-debug.js'
					]
				}
			},

			fonts: {
				files: {
					'dist/glyphicons-halflings-regular.woff2':
						'bower_components/bootstrap/fonts/glyphicons-halflings-regular.woff2',
					'dist/glyphicons-halflings-regular.woff':
						'bower_components/bootstrap/fonts/glyphicons-halflings-regular.woff',
					'dist/glyphicons-halflings-regular.ttf':
						'bower_components/bootstrap/fonts/glyphicons-halflings-regular.ttf',
					'dist/glyphicons-halflings-regular.eot':
						'bower_components/bootstrap/fonts/glyphicons-halflings-regular.eot',
					'dist/glyphicons-halflings-regular.svg':
						'bower_components/bootstrap/fonts/glyphicons-halflings-regular.svg'
				}
			},

			/*server: {
				files: {
					'dist/<%=server.name%>.js': [ 'server/cxl.js' ],
					'dist/<%=server.name%>.dbg.js': [
						'server/cxl.js', 'src/cxl-debug.js' ]
				}
			},*/

			tpl: {

				options: {
					process: function(src, path)
					{
						var id = path.replace(/^client\//, '');

						return '<script type="text/template" ' +
							'id="' + id + '">\n' + src +
							'</script>\n';
					}
				},

				files: {
					'dist/templates.html': 'client/**/*.html'
				}

			}
		},

		uglify: {
			client: {
				compress: true,
				files: {
					'dist/<%= client.name %>.min.js': 'dist/<%= client.name %>.js'
					//'dist/<%= server.name %>.min.js': 'dist/<%= server.name %>.js'
				}
			}
		},

		less: {

			client: {
				options: {
					paths: [ 'bower_components', 'less' ],
					sourceMap: true,
					strictImports: true,
					sourceMapURL: '<%= client.name %>.css.map',
					compress: true
				},
				files: {
					'dist/<%= client.name %>.css': [
						'less/main.less'
					]
				}
			}
		},

		watch: {
			client: {
				files: '<%= jshint.client.src %>',
				tasks: [ 'jshint:client', 'concat:client', 'karma' ]
			},

			less: {
				files: 'less/**/*.less',
				tasks: [ 'less:client' ]
			},

			test_client: {
				files: 'test/client/**/*.js',
				tasks: [ 'jshint:test', 'karma:client' ]
			},

			tpl: {
				files: 'client/**/*.html',
				tasks: [ 'concat:tpl' ]
			}
		},

		nodeunit: {

			all: [ 'test/*.js' ],
			options: {
				reporter: 'verbose'
			}

		},

		karma: {

			options: {

				frameworks: [ 'qunit' ],
				browsers: [ 'PhantomJS' ],
				reporters: [ 'progress', 'coverage' ],
				singleRun: true,
				coverageReporter: {
					subdir: 'report'
				}
			},

			client: {
				plugins: [
					'karma-qunit', 'karma-coverage', 'karma-phantomjs-launcher'
				],
				files: [
					{ src: [
						'client/cxl-polyfill.js',
						'bower_components/jquery/dist/jquery.js',
						'bower_components/bootstrap/dist/js/bootstrap.js',
						'bower_components/lodash/lodash.js',
						'bower_components/backbone/backbone.js',
						'bower_components/backbone-validation/dist/backbone-validation.js',
						'bower_components/firebase/firebase.js',
						'<%= src.client %>'
					]},
					{ src: 'test/client/*.js' }
				],
				preprocessors: {
					'client/**/*.js': [ 'coverage' ]
				}
			}
		},

		copy: {

			client: {
				files: [
					{
						expand:true,
						src: '*',
						dest: 'dist',
						cwd: 'bower_components/bootstrap/fonts'
					}
				]
			}

		}


	});

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-nodeunit');
	grunt.loadNpmTasks('grunt-contrib-copy');

	grunt.loadNpmTasks('grunt-karma');

	grunt.registerTask('default', [ 'jshint', 'clean', 'concat', 'copy', 'less' ]);
	grunt.registerTask('minify', [ 'default', 'uglify:dist' ]);
	grunt.registerTask('release', [ 'default', 'uglify:release']);
};

module.exports = function(grunt) {

	grunt.initConfig({

		client: grunt.file.readJSON('bower.json'),
		server: grunt.file.readJSON('package.json'),

		clean: {
			client: [ 'client' ]
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
					'dist/<%=client.name%>.js': [ 'client/cxl.js' ],
					'dist/<%=client.name%>.dbg.js': [
						'client/cxl.js', 'src/cxl-debug.js' ]
				}
			},

			setver: {
				files: {
					'dist/<%=server.name%>.js': [ 'server/cxl.js' ],
					'dist/<%=server.name%>.dbg.js': [
						'server/cxl.js', 'src/cxl-debug.js' ]
				}
			},

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
					'dist/<%= client.name %>.min.js': 'dist/<%= client.name %>.js',
					'dist/<%= server.name %>.min.js': 'dist/<%= server.name %>.js'
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
				files: 'client/less/**/*.less',
				tasks: [ 'less:client' ]
			},

			test: {
				files: 'test/**/*.js',
				tasks: [ 'jshint:test', 'karma' ]
			},

			tpl: {
				files: 'client/**/*.html',
				tasks: [ 'concat:tpl' ]
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

			dist: {
				plugins: [
					'karma-qunit', 'karma-coverage', 'karma-phantomjs-launcher'
				],
				files: [
					{ src: [
						'bower_components/jquery/dist/jquery.js',
						'bower_components/bootstrap/dist/js/bootstrap.js',
						'bower_components/underscore/underscore.js',
						'bower_components/backbone/backbone.js',
						'src/cxl.js', 'src/cxl-debug.js'
					]},
					{ src: 'test/**/*.js' }
				],
				preprocessors: {
					'src/**/*.js': [ 'coverage' ]
				}
			}
		}

	});

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-karma');

	grunt.registerTask('default', [ 'jshint', 'clean', 'concat', 'less' ]);
	grunt.registerTask('minify', [ 'default', 'uglify:dist' ]);
	grunt.registerTask('release', [ 'default', 'uglify:release']);
};

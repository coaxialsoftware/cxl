module.exports = function(grunt) {

	grunt.initConfig({

		pkg: grunt.file.readJSON('bower.json'),

		clean: {
			dist: [ 'dist' ]
		},

		jshint: {
			dist: {
				options: { jshintrc: 'src/.jshintrc' },
				src: 'src/**/*.js'
			},

			test: {
				options: { jshintrc: 'test/.jshintrc' },
				src: 'test/**/*.js'
			}
		},

		concat: {
			options: {
				banner: grunt.file.read('src/banner.txt'),
				stripBanners: true,
			},

			dist: {
				files: {
					'dist/<%=pkg.name%>.js': [ 'src/cxl.js' ],
					'dist/<%=pkg.name%>.dbg.js': [ 'src/cxl.js', 'src/cxl-debug.js' ]
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
			dist: {
				compress: true,
				files: {
					'dist/<%= pkg.name %>.min.js': 'dist/<%= pkg.name %>.js'
				}
			},

			release: {
				compress: true,
				files: {
					'dist/<%= pkg.name %>.<%= pkg.version %>.min.js': 'dist/<%= pkg.name %>.js'
				}
			}
		},

		less: {

			main: {
				options: {
					paths: [ 'bower_components', 'less' ],
					sourceMap: true,
					strictImports: true,
					sourceMapURL: '<%= pkg.name %>.css.map',
					compress: true
				},
				files: {
					'dist/<%= pkg.name %>.css': [
						'less/main.less'
					]
				}
			}
		},

		watch: {
			dist: {
				files: '<%= jshint.dist.src %>',
				tasks: [ 'jshint:dist', 'concat:dist', 'karma' ]
			},

			less: {
				files: 'client/less/**/*.less',
				tasks: [ 'less:main' ]
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

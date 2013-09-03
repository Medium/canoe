module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-gh-pages');

  grunt.initConfig({
    watch: {
      module: {
        files: ['index.js', 'lib/*'],
        tasks: 'default'
      },
      tests: {
        files: ['test/**/*'],
        tasks: 'exec:test'
      }
    },
    jsdoc: {
      docs: {
        src: ['./*.js', './lib/*.js'],
        options: {
          destination: 'docs',
          private: true
        }
      }
    },
    'gh-pages': {
      docs: {
        src: '**/*',
        options: {
          base: 'docs'
        }
      }
    },
    exec: {
      test: {
        command: 'npm test'
      },
      docsIndex: {
        // The default index page is mostly empty and confusing
        command: 'cp ./docs/S3Utils.html ./docs/index.html'
      }
    },
    jshint: {
      files: ['index.js', 'lib/*.js']
    },
  });

  grunt.registerTask('default', ['jshint', 'exec:test', 'docs']);
  grunt.registerTask('docs', ['jsdoc:docs', 'exec:docsIndex']);
};

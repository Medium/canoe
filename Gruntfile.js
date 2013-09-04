module.exports = function(grunt) {
  var path = require('path');
  var docsRoot = '.grunt/docs';

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
          destination: docsRoot,
          private: true
        }
      }
    },
    'gh-pages': {
      docs: {
        src: '**/*',
        options: {
          base: docsRoot
        }
      }
    },
    exec: {
      test: {
        command: 'npm test'
      },
      docsIndex: {
        // The default index page is mostly empty and confusing
        // This sets it to use the main class' docs
        command: 'cp ' + [path.join(docsRoot, 'S3Utils.html'), path.join(docsRoot, 'index.html')].join(' ')
      }
    },
    jshint: {
      files: ['index.js', 'lib/*.js']
    },
  });

  grunt.registerTask('default', ['jshint', 'exec:test', 'docs']);
  grunt.registerTask('docs', ['jsdoc:docs', 'exec:docsIndex']);
  grunt.registerTask('prepublish', ['default', 'gh-pages']);
};

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-docco-multi');
  grunt.loadNpmTasks('grunt-gh-pages');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.initConfig({
    watch: {
      module: {
        files: ['index.js', 'lib/*'],
        tasks: ['default', 'docco']
      },
      tests: {
        files: ['test/**/*'],
        tasks: 'exec:test'
      }
    },
    exec: {
      test: {
        command: 'npm test'
      }
    },
    jshint: {
      files: ['index.js', 'lib/*.js']
    },
    'gh-pages': {
      src: ['*'],
      options: {
        base: 'docs'
      }
    },
    docco: {
      files: {
        src: ['index.js', 'lib/*']
      }
    }
  });

  grunt.registerTask('default', ['jshint', 'exec:test']);
  grunt.registerTask('gh-docs', ['docco', 'gh-pages']);
};

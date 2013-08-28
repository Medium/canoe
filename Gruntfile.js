module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-contrib-watch');

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
    exec: {
      test: {
        command: 'npm test'
      }
    },
    jshint: {
      files: ['index.js', 'lib/*.js']
    },
  });

  grunt.registerTask('default', ['jshint', 'exec:test']);
};

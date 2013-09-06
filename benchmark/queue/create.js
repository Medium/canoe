var S3Queue = require('../../lib/Queue')

module.exports = {
  name: 'S3Queue: Create instance',
  fn: function() {
    var q = new S3Queue()
  }
}

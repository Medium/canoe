var crypto = require('crypto')
var S3Queue = require('../../lib/Queue')
var q = new S3Queue()

var randomItem = crypto.randomBytes(10000)
var largeRandomItem = crypto.randomBytes(10000000)

module.exports = {
  name: 'S3Queue: Push one item',
  tests: {
    'Push one small item': function() {
      q.push(randomItem)
    },
    'Push one large item': function() {
      q.push(largeRandomItem)
    }
  }
}

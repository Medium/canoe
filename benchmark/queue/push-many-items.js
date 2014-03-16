var crypto = require('crypto')
var S3Queue = require('../../lib/Queue')
var q = new S3Queue()

// Create a bunch of dummy data to add to our queue
// Use different chunk sizes but make each set add up to the same total size
var testSizes = ['Big', 'Medium', 'Small']

var randomBytes = {}
testSizes.forEach(function (size) {
  randomBytes[size] = []
})
var largeChunkSize = 100000

var i
var j
var factor
for (i = 0; i < 100; i++) {
  factor = 1
  testSizes.forEach(function (size) {
    for (j = 0; j < factor; j++) randomBytes[size].push(crypto.randomBytes(largeChunkSize / factor));
    factor *= 10
  })
}

var tests = {}
testSizes.forEach(function (testSize) {
  var testName = testSize + ' items'
  tests[testName] = function () {
    randomBytes[testSize].forEach(q.push.bind(q))
    q.reset()
  }
})

module.exports = {
  name: 'S3Queue: Push many items (~10 MB)',
  tests: tests
}

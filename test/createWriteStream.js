// Copyright 2013 The Obvious Corporation.

var fs = require('fs')
var crypto = require('crypto')
var should = require('should')

// Replace the AWS library with the shim
var awsShim = require('./shim/aws')
var S3Utils = require('../index')

var getStream = function (threshold, cb) {
  if (typeof threshold === 'function') {
    cb = threshold;
    threshold = undefined;
  }

  var s3Shim = new awsShim.S3()
  var s3Utils = new S3Utils(s3Shim)
  var params = {Bucket: 'test-bucket', Key: 'testkey.log', Threshold: threshold}
  return s3Utils.createWriteStream(params, cb)
}

var getLargeString = function (numMegs) {
  var charArray = []
  for (var i = 0; i < numMegs * 1024 * 64; i++) charArray.push('0123456789abcdef')
  return charArray.join('')
}


describe('S3 createWriteStream', function () {
  it('Should create writable stream', function (done) {
    var immediateStream = getStream(function (err, stream) {
      stream.should.be.instanceof(require('stream').Writable)
      immediateStream.should.equal(stream)

      done()
    })

    immediateStream.should.be.instanceof(require('stream').Writable)
  })

  it('Should be writable', function (done) {
    getStream(function (err, stream) {
      stream.write("And we will never be alone again").should.be.ok
      done()
    })
  })

  it('Should emit a "writable" event', function (done) {
    getStream().on('writable', done)
  })

  it('Should emit "uploaded" event', function (done) {
    getStream(function (err, stream) {
      stream.on('uploaded', function (err, response, chunk) {
        response.should.have.property('ETag')
        chunk.should.be.instanceof(Buffer)

        done(err)
      })
      stream.end("Somebody tell me if I am sleeping")
    })
  })

  it('Should perform an upload when data exceeds the threshold', function (done) {
    getStream(function (err, stream) {
      stream.on('uploaded', function (err, response, chunk) {
        response.should.have.property('ETag')
        chunk.should.be.instanceof(Buffer)

        done(err)
      })
      stream.write(getLargeString(10))  // Send in 10MB.
    })
  })

  it('Should not perform an upload when size is < custom threshold', function (done) {
    getStream(function (err, stream) {
      stream.setThreshold(10 * 1024 * 1024).on('uploaded', function (err, response, chunk) {
        should.fail('The uploaded event was emitted when data < threshold.')
        done()
      })
      stream.write(getLargeString(5))  // Send in 5MB.
    })
    // This test checks for the *lack* of an event, so we wait briefly for that
    // event, and then call done.
    setTimeout(done, 1500)
  })

  it('Should emit "finish" event', function (done) {
    getStream(function (err, stream) {
      stream.on('finish', done)
      stream.end("'Cause it doesn't happen every day")
    })
  })

  it('Should emit "complete" before "finish"', function (done) {
    getStream(function (err, stream) {
      stream.once('complete', function () {
        stream.once('finish', done)
      })

      stream.end("Shadows on you break out into the light")
    })
  })

  it('Should error on writes after end', function (done) {
    getStream(function (err, stream) {
      stream.end("'Cause it doesn't happen every day")

      stream.write('Rewind', function (err) {
        err.should.be.instanceof(Error)
        done()
      })
    })
  })

  it('Should write data', function (done) {
    getStream(function (err, stream) {
      var lyric = "Kinda counted on you being a friend"
      var body = ''

      stream.on('uploaded', function (err, response, chunk) {
        body += chunk.toString()
      })

      stream.on('finish', function () {
        body.should.equal(lyric)
        done()
      })

      stream.end(lyric)
    })
  })

  it('Should pipe readable streams', function (done) {
    getStream(function (err, stream) {
      var body = ''
      stream.on('uploaded', function (err, response, chunk) {
        body += chunk.toString()
      })

      stream.on('finish', function (err) {
        var expected = fs.readFileSync(__filename, 'utf8')
        body.should.equal(expected, 'Did not write file contents correctly')

        done(err)
      })
      fs.createReadStream(__filename).pipe(stream)
    })
  })

  it('Should handle immediate writes', function (done) {
    var stream = getStream()

    stream.on('finish', done)
    stream.end("Now I thought about what I wanna say")
  })

  it('Should run callbacks', function (done) {
    var stream = getStream()
    stream.write("But I never really know where to go", done)
  })

  it('Should return false on writes that overflow the highWaterMark', function () {
    var highWaterMark = getStream()._writableState.highWaterMark
    var bigContent = crypto.randomBytes(highWaterMark)
    getStream().write(bigContent).should.not.be.ok
  })

  it('Should complete upload even if chunk argument to end() is false', function (done) {
    var stream = getStream()
    stream.on('complete', done)

    stream.write("Driving this road down to paradise\n")
    stream.write("Letting the sunlight into my eyes")
    stream.end(false)
  })

  it('Should finish the chorus', function () {
    var stream = getStream()
    stream.end("So I chained myself to a friend\n'Cause I know it unlocks like a door")
  })
})

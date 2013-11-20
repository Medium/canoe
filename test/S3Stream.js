// Copyright 2013 The Obvious Corporation.

var stream = require('stream')
var crypto = require('crypto')

var awsShim = require('./shim/aws')
var s3Shim = new awsShim.S3()
var s3params = {Bucket: 'unit-test-bucket', Key: 'some-file.log'}

var S3Stream = require('../lib/Stream')
var S3Queue = require('../lib/Queue')
var should = require('should')

var getStream = function () {
  return new S3Stream(s3params, s3Shim)
}

var bigContent = crypto.randomBytes(getStream().queue.threshold)

describe('S3Stream', function () {
  it('Should exist', function () {
    should.exist(S3Stream)
  })

  it('Should instantiate stream', function () {
    getStream().should.be.instanceof(S3Stream)
  })

  it('Should use S3 shim', function () {
    getStream().s3.shim.should.be.ok
  })

  it('Should instantiate a queue', function () {
    getStream().queue.should.be.instanceof(S3Queue)
  })

  it('Should be a writable stream', function () {
    getStream().should.be.instanceof(stream.Writable)
  })

  it('Should provide a _write() method', function () {
    var oldWrite = stream.Writable.prototype._write
    getStream()._write.should.not.equal(oldWrite)
  })

  it('Should be writable', function () {
    getStream().write("Sweat, sweat, sweat").should.be.ok
  })

  it('Should return false when buffered', function () {
    getStream().write(bigContent).should.not.be.ok
  })

  it('Should have a non-drainable queue before writable event', function () {
    var s3stream = getStream()
    s3stream.queue.drainable.should.not.be.ok
  })

  it('Should have a drainable queue after writable event', function () {
    var s3stream = getStream()
    s3stream.once('writable', function () {
      // Call this from setImmediate to give the internal event listener a chance to run first.
      setImmediate(function () {
        s3stream.queue.drainable.should.be.ok
      })
    })
  })
})

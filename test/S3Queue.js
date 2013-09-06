// Copyright 2012 The Obvious Corporation.

var events = require('events')
var crypto = require('crypto')
var S3Queue = require('../lib/Queue')
var should = require('should')

// Compute this here so Mocha doesn't get annoyed by a slow test
var q = new S3Queue()
var bigChunk = crypto.randomBytes(q.threshold())

describe('S3Queue', function() {
  it('Should exist', function() {
    should.exist(S3Queue)
  })

  it('Should instantiate a queue', function() {
    var q = new S3Queue()
    q.should.be.instanceof(S3Queue, 'S3Queue instance')
    q.should.be.instanceof(events.EventEmitter, 'EventEmitter instance')
  })

  it('Should set initial state', function() {
    var q = new S3Queue()
    q.chunks.toString().should.equal('')
  })

  it('Should add chunk', function(done) {
    var q = new S3Queue()
    var chunk = new Buffer("I know you don't get chance to take a break this often")
    q.on('push', function(pushed){
      var err = chunk === pushed ? null : 'Incorrect chunk added'
      done(err)
    })

    q.push(chunk)
  })

  it('Should add multiple chunks', function() {
    var q = new S3Queue()
    var chunk = new Buffer("I know your life is speeding ")
    q.push(chunk)

    var nextChunk = new Buffer("and it isn't stopping")
    q.push(nextChunk)

    q.chunks.join('').should.equal("I know your life is speeding and it isn't stopping")
  })

  it('Should drain when full', function(done) {
    var q = new S3Queue()
    // Make a temp listener to check that drain doesn't fire before it should
    var dontDrainYet = function() {
      done('Drained too early')
    }
    q.on('drain', dontDrainYet)
    q.push(new Buffer("Here take my shirt and just go ahead and wipe up all the"))
    q.removeListener('drain', dontDrainYet)

    q.on('drain', function(body) {
      body.length.should.be.above(q.threshold(), 'Drained body length')
      done()
    })

    q.push(bigChunk)
  })
})

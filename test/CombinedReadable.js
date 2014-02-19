// Copyright 2014 A Medium Corporation.

var fs = require('fs')
var path = require('path')
var Readable = require('stream').Readable
var should = require('should')
var CombinedReadable = require('../lib/CombinedReadable')

var filePaths = {
  one: path.join(__dirname, './files/one'),
  two: path.join(__dirname, './files/two')
}

describe('Combined Readable', function () {
  it('Should exist', function () {
    should.exist(CombinedReadable)
  })

  it('Should create a stream', function () {
    var files = [fs.createReadStream(filePaths.one), fs.createReadStream(filePaths.two)]
    var combined = new CombinedReadable(files)
    combined.should.be.instanceof(Readable)
  })

  it('Should combine the output', function (done) {
    var files = [filePaths.one, filePaths.two]
    var data = files.map(function (file) {
      return fs.readFileSync(file, 'utf8')
    }).join('')

    var combined = new CombinedReadable(files.map(fs.createReadStream))
    var out = ''
    combined.on('data', function (chunk) {
      out += chunk
    })

    combined.on('error', done)
    combined.on('end', function () {
      out.should.eql(data)
      done()
    })
  })
})

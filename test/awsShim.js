// Copyright 2013 The Obvious Corporation.

var async = require('async')
var should = require('should')

var awsShim = require('./shim/aws')
var s3shim = function () { return new awsShim.S3() }

// Basic existance
describe('AWS Shim, testing the tests', function () {
  it('Should exist', function () {
    should.exist(awsShim)
  })

  it('Should create S3 instance', function () {
    should.exist(s3shim())
  })

  it('Should be the shim', function () {
    var s3 = s3shim()

    should.exist(s3.shim)
    s3.shim.should.be.ok
  })

  it('Should have required methods', function () {
    var required = [
      'createMultipartUpload',
      'abortMultipartUpload',
      'completeMultipartUpload',
      'uploadPart'
    ]

    required.forEach(function (method) {
      s3shim()[method].should.be.instanceof(Function, method)
    })
  })


  /*
   * createMultipartUpload()
   */
  describe('createMultipartUpload()', function () {
    it('Should create multipart upload ID', function (done) {
      var params = {Bucket: 'test-bucket', Key: 'test-file'}
      s3shim().createMultipartUpload(params, function (err, data) {
        data.UploadId.should.be.ok.and.a('string')
        done(err)
      })
    })

    it('Should require Bucket and Key params', function (done) {
      var getParams = function () { return {Bucket: 'test-bucket', Key: 'test-file'} }
      async.each(['Bucket', 'Key'], function (key, cb) {
        var params = getParams()
        delete params[key]

        s3shim().createMultipartUpload(params, function (err, data) {
          err.should.be.instanceof(Error)
          err.message.should.equal(key + ' is required')
          cb()
        })
      }, done)
    })

    it('Should generate random UploadId', function (done) {
      var params = {Bucket: 'test-bucket', Key: 'test-file'}
      async.times(2, function (id, cb) {
        s3shim().createMultipartUpload(params, function (err, data) {
          cb(err, data.UploadId)
        })
      }, function (err, uploadIds) {
        uploadIds.should.be.instanceof(Array).and.have.length(2)
        uploadIds.forEach(function (uploadId) {
          uploadId.should.be.a('string')
        })
        uploadIds[0].should.not.equal(uploadIds[1])
        done(err)
      })
    })
  })


  /*
   * abortMultipartUpload()
   */
  describe('abortMultipartUpload()', function () {
    it('Should be able to abort upload', function (done) {
      var params = {Bucket: 'test-bucket', Key: 'test-file'}
      s3shim().createMultipartUpload(params, function (err, data) {
        params.UploadId = data.UploadId
        var sendAbort = s3shim().abortMultipartUpload(params).send

        sendAbort.should.be.instanceof(Function)
        done(err)
      })
    })

    it('Should fail on send if UploadId does not match', function (done) {
      var params = {Bucket: 'test-bucket', Key: 'test-file'}
      s3shim().createMultipartUpload(params, function (err, data) {
        params.UploadId = data.UploadId + 'fake'
        var sendAbort = s3shim().abortMultipartUpload(params).send(function (err) {
          err.should.be.instanceof(Error)
          err.message.should.equal('UploadId does not match')
          done()
        })
      })
    })
  })


  /*
   * uploadPart()
   */
  describe('uploadPart()', function () {
    it('Should upload a part', function (done) {
      var params = {Bucket: 'test-bucket', Key: 'test-file'}
      var s3 = s3shim()
      s3.createMultipartUpload(params, function (err, data) {
        params.Body = new Buffer("Like the legend of the phoenix")
        params.PartNumber = '1'
        params.UploadId = data.UploadId

        s3.uploadPart(params, function (err, data) {
          data.ETag.should.be.ok.and.a('string')
          done(err)
        })
      })
    })

    it('Should fail if the UploadId does not match', function (done) {
      var params = {Bucket: 'test-bucket', Key: 'test-file'}
      s3shim().createMultipartUpload(params, function (err, data) {
        params.Body = new Buffer("All ends with beginnings")
        params.PartNumber = '1'
        params.UploadId = data.UploadId + 'fake'

        s3shim().uploadPart(params, function (err, data) {
          err.should.be.instanceof(Error)
          err.message.should.equal('UploadId does not match')
          done()
        })
      })
    })

    it('Should fail if the PartNumber is not a string', function (done) {
      var params = {Bucket: 'test-bucket', Key: 'test-file'}
      s3shim().createMultipartUpload(params, function (err, data) {
        params.Body = new Buffer("What keeps the planet spinning")
        params.PartNumber = 1
        params.UploadId = data.UploadId

        s3shim().uploadPart(params, function (err, data) {
          err.should.be.instanceof(Error)
          err.message.should.equal('PartNumber must be a String')
          done()
        })
      })
    })

    it('Should require params', function (done) {
      var getParams = function () {
        return {
          Bucket: 'test-bucket',
          Key: 'test-file',
          Body: new Buffer("Like the legend of the phoenix"),
          PartNumber: '1'
        }
      }

      var required = ['Body', 'Bucket', 'Key', 'PartNumber']

      var params = getParams()
      s3shim().createMultipartUpload(params, function (err, data) {

        params.UploadId = data.UploadId

        async.each(required, function (key, cb) {
          var failParams = getParams()
          delete failParams[key]
          s3shim().uploadPart(failParams, function (err, data) {
            err.should.be.instanceof(Error)
            err.message.should.equal(key + ' is required')
            cb()
          })
        }, done)
      })
    })
  })


  /*
   * completeMultipartUpload()
   */
  describe('completeMultipartUpload()', function () {
    it('Should complete an upload', function (done) {
      var params = {Bucket: 'test-bucket', Key: 'test-file'}
      var s3 = s3shim()
      s3.createMultipartUpload(params, function (err, data) {
        params.Body = new Buffer("The force of love beginning")
        params.PartNumber = '1'
        params.UploadId = data.UploadId

        // fake some upload data
        params.MultipartUpload = [
          {ETag: 'first etag', PartNumber: 1},
          {ETag: 'second etag', PartNumber: 2}
        ]

        s3.completeMultipartUpload(params, done)
      })
    })

    it('Should fail if UploadId does not match', function (done) {
      var params = {Bucket: 'test-bucket', Key: 'test-file'}
      var s3 = s3shim()
      s3.createMultipartUpload(params, function (err, data) {
        params.Body = new Buffer("We've come too far to give up who we are")
        params.PartNumber = '1'
        params.UploadId = data.UploadId + 'fake'

        // fake some upload data
        params.MultipartUpload = [
          {ETag: 'first etag', PartNumber: 1},
          {ETag: 'second etag', PartNumber: 2}
        ]

        s3shim().completeMultipartUpload(params, function (err) {
          err.should.be.instanceof(Error)
          err.message.should.equal('UploadId did not match')

          done()
        })
      })
    })

    it('Should fail if MultipartUpload is not sorted', function (done) {
      var params = {Bucket: 'test-bucket', Key: 'test-file'}
      var s3 = s3shim()
      s3.createMultipartUpload(params, function (err, data) {
        params.Body = new Buffer("So let's raise the bar and our cups to the stars")
        params.PartNumber = '1'
        params.UploadId = data.UploadId

        // fake some upload data
        params.MultipartUpload = [
          {ETag: 'first etag', PartNumber: 2},
          {ETag: 'second etag', PartNumber: 1}
        ]

        s3.completeMultipartUpload(params, function (err) {
          err.should.be.instanceof(Error)
          err.message.should.equal('MultipartUpload was not sorted')

          done()
        })
      })
    })

    it('Should require params', function (done) {
      var required = ['Bucket', 'Key', 'UploadId', 'MultipartUpload']
      var getParams = function () {
        return {
          Bucket: 'test-bucket',
          Key: 'test-file',
          Body: new Buffer("So let's raise the bar and our cups to the stars"),
          MultipartUpload: [
            {ETag: 'second etag', PartNumber: 1},
            {ETag: 'first etag', PartNumber: 2}
          ]
        }
      }

      var params = getParams()
      s3shim().createMultipartUpload(params, function (err, data) {
        var UploadId = data.UploadId

        async.each(required, function (key, cb) {
          var params = getParams()
          params.UploadId = UploadId
          delete params[key]

          s3shim().completeMultipartUpload(params, function (err) {
            err.should.be.instanceof(Error)
            err.message.should.equal(key + ' is required')

            cb()
          })
        }, done)
      })
    })
  })

})
